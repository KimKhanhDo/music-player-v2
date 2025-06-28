/**
 * 1. Set constant for local storage: theme, volume, isMuted, lastPlayedIndex
 * 2.1 Display time on progress bar -> mm:ss / mm:ss
 * 2.2 Display time for each song
 * 3. Click on song to play -> assign data-index -> use delegation
 * 4. Search song
 * 5. Theme switch (dark/light) on top left
 * 6. 3 dots -> context menu -> delete, favorite
 *
 */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_SETTINGS = 'MUSIC_PLAYER_APP';

const app = {
    // Constants
    NEXT_SONG: 1,
    PREVIOUS_SONG: -1,
    RESET_TIME_THRESHOLD: 2, // Thời gian tối thiểu (giây) để reset bài hiện tại thay vì chuyển bài trước

    // DOM elements
    player: $('.player'),
    playList: $('.playlist'),
    cd: $('.cd'),
    titleHeading: $('header h2'),
    cdThumb: $('.cd-thumb'),
    audioPlayer: $('#audio'),
    togglePlayBtn: $('.btn-toggle-play'),
    playIcon: $('.play-icon'),
    nextBtn: $('.btn-next'),
    previousBtn: $('.btn-prev'),
    repeatBtn: $('.btn-repeat'),
    randomBtn: $('.btn-random'),
    progressBar: $('.progress'),

    // List of songs
    songs: [
        {
            name: 'Cầu Duyên',
            singer: 'Chị Đẹp',
            path: './assets/music/cau-duyen.mp3',
            image: './assets/img/cau-duyen.webp',
        },
        {
            name: 'Cầu Vồng Lấp Lánh',
            singer: 'Dương Hoàng Yến',
            path: './assets/music/cau-vong-lap-lanh.mp3',
            image: './assets/img/cau-vong-lap-lanh.jpeg',
        },
        {
            name: 'Có Chàng Trai Viết Lên Cây',
            singer: 'Phan Mạnh Quỳnh',
            path: './assets/music/co-chang-trai-viet-len-cay.mp3',
            image: './assets/img/co-chang-trai-viet-len-cay.jpeg',
        },
        {
            name: 'Đậm Đà',
            singer: 'Tóc Tiên',
            path: './assets/music/dam-da.mp3',
            image: './assets/img/dam-da.jpeg',
        },
        {
            name: 'Đưa Em Về Nhà',
            singer: 'Chillies',
            path: './assets/music/dua-em-ve-nha.mp3',
            image: './assets/img/dua-em-ve-nha.jpeg',
        },
        {
            name: 'May Mắn',
            singer: 'Bùi Lan Hương x Ái Phương',
            path: './assets/music/may-man.mp3',
            image: './assets/img/may-man.jpeg',
        },
        {
            name: 'Mê Muội',
            singer: 'Bùi Lan Hương',
            path: './assets/music/me-muoi.mp3',
            image: './assets/img/me-muoi.jpeg',
        },
        {
            name: 'Miền Mộng Mị',
            singer: 'AMEE x Tlinh',
            path: './assets/music/mien-mong-mi.mp3',
            image: './assets/img/mien-mong-mi.jpeg',
        },
        {
            name: 'Từng Là',
            singer: 'Vũ Cát Tường',
            path: './assets/music/tung-la.mp3',
            image: './assets/img/tung-la.jpeg',
        },
        {
            name: 'Vị Nhà',
            singer: 'Đen Vâu',
            path: './assets/music/vi-nha.mp3',
            image: './assets/img/vi-nha.jpeg',
        },
    ],

    // Player states
    currentSongIndex: 0,
    isPlaying: false,
    isLoopMode: localStorage.getItem('loop') === 'true',
    isRandomMode: localStorage.getItem('random') === 'true',

    start() {
        this._handlePlayerEvents();

        // Load the 1st song on UI when app start
        this._loadCurrentSong();
        this._renderPlaylist();
    },

    // === Helper Functions ===
    _handlePlayerEvents() {
        const cdRotation = this._setupCdRotation();

        // Handle CD zoom in/ out
        const cdWidth = this.cd.offsetWidth;
        document.onscroll = () => {
            const scrollTop =
                window.scrollY || document.documentElement.scrollTop;

            const newCdWidth = Math.max(cdWidth - scrollTop, 0);

            this.cd.style.width = newCdWidth + 'px';
            this.cd.style.opacity = newCdWidth / cdWidth;
        };

        // Playback & Render UI state for button when play/pause on audioPlayer element
        this.togglePlayBtn.onclick = this._togglePlayback.bind(this);

        this.audioPlayer.onplay = () => {
            this.isPlaying = true;
            cdRotation.play();

            this.playIcon.classList.remove('fa-play');
            this.playIcon.classList.add('fa-pause');
        };

        this.audioPlayer.onpause = () => {
            this.isPlaying = false;
            cdRotation.pause();

            this.playIcon.classList.remove('fa-pause');
            this.playIcon.classList.add('fa-play');
        };

        // Controls
        this.nextBtn.onclick = this._handleSongNavigation.bind(
            this,
            this.NEXT_SONG
        );
        this.previousBtn.onclick = this._handleSongNavigation.bind(
            this,
            this.PREVIOUS_SONG
        );

        this.repeatBtn.onclick = this._toggleLoopMode.bind(this);
        this.randomBtn.onclick = this._toggleRandomMode.bind(this);

        // Progress bar
        this.audioPlayer.ontimeupdate = this._updateProgressBar.bind(this);

        // Handle rewind/fast forward when adjusting the progress bar
        this.progressBar.oninput = this._seekAudio.bind(this);

        // Auto move to next song when audioPlayer ends
        this.audioPlayer.onended = this._handleSongNavigation.bind(
            this,
            this.NEXT_SONG
        );
    },

    _updateProgressBar() {
        // this.audioPlayer.duration will be NaN/ undefined if:
        // - The file hasn't finished loading
        // - The file is corrupted or doesn't exist
        // - The browser can't read the file format
        if (!this.audioPlayer.duration) return;

        const percent = Math.floor(
            (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
        );
        this.progressBar.value = percent;
        this.progressBar.style.setProperty('--progress-value', `${percent}%`);
    },

    _seekAudio() {
        this.audioPlayer.currentTime =
            (this.progressBar.value / 100) * this.audioPlayer.duration;
    },

    // Force playback state to 'playing' when switching songs.
    // ⚠️ This means the new song will auto-play even if the user had paused playback.
    // Useful for auto-play behavior (e.g. when current song ends)
    _handleSongNavigation(direction) {
        this.isPlaying = true;

        const isPreviousPressed = direction === this.PREVIOUS_SONG;
        const isPastResetTime =
            this.audioPlayer.currentTime > this.RESET_TIME_THRESHOLD;

        if (isPreviousPressed && isPastResetTime) {
            this.audioPlayer.currentTime = 0;
            return;
        }

        if (this.isRandomMode) {
            this.currentSongIndex = this._getRandomSongIndex();
        } else {
            this.currentSongIndex += direction;
        }

        this._applySongChange();
    },

    _getRandomSongIndex() {
        if (this.songs.length === 1) return this.currentSongIndex;

        let randomIndex = null;

        do {
            randomIndex = Math.floor(Math.random() * this.songs.length);
        } while (randomIndex === this.currentSongIndex);

        return randomIndex;
    },

    _setRandomMode() {
        this.randomBtn.classList.toggle('active', this.isRandomMode);
        localStorage.setItem('random', this.isRandomMode);
    },

    _toggleLoopMode() {
        this.isLoopMode = !this.isLoopMode;
        this._setLoopMode();
    },

    _toggleRandomMode() {
        this.isRandomMode = !this.isRandomMode;
        this._setRandomMode();
    },

    _setLoopMode() {
        this.audioPlayer.loop = this.isLoopMode;
        this.repeatBtn.classList.toggle('active', this.isLoopMode);
        localStorage.setItem('loop', this.isLoopMode);
    },

    _applySongChange() {
        // + this.songs.length -> avoid negative index/ exceed length
        this.currentSongIndex =
            (this.currentSongIndex + this.songs.length) % this.songs.length;
        this._loadCurrentSong();
        this._renderPlaylist();
    },

    // Call play/ pause
    _togglePlayback() {
        this.audioPlayer.paused
            ? this.audioPlayer.play()
            : this.audioPlayer.pause();
    },

    _loadCurrentSong() {
        const currentSong = this._getCurrentSong();

        // Update the song's data based on the current song
        this.titleHeading.textContent = currentSong.name;
        this.cdThumb.style.backgroundImage = `url('${currentSong.image}')`;
        this.audioPlayer.src = currentSong.path;

        this._setLoopMode();
        this._setRandomMode();

        // When the audioPlayer is ready to play (enough data has been loaded)
        // Check the current app state
        // If the app is currently playing, start playing the new song automatically
        // Otherwise, keep it paused
        this.audioPlayer.oncanplay = () => {
            if (this.isPlaying) {
                this.audioPlayer.play();
            }
        };
    },

    _getCurrentSong() {
        return this.songs[this.currentSongIndex];
    },

    _renderPlaylist() {
        const html = this.songs
            .map((song, index) => {
                const isActive = index === this.currentSongIndex;

                return `
               <div class="song ${isActive ? 'active' : ''}">
                    <div
                        class="thumb"
                        style="
                            background-image: url(${this._escapeHTML(
                                song.image
                            )});
                        "
                    ></div>
                    <div class="body">
                        <h3 class="title">${this._escapeHTML(song.name)}</h3>
                        <p class="author">${this._escapeHTML(song.singer)}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-heart"></i>
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `;
            })
            .join('');

        this.playList.innerHTML = html;
    },

    _setupCdRotation() {
        const cdAnimation = this.cdThumb.animate(
            [{ transform: 'rotate(360deg)' }],
            {
                duration: 10000,
                iterations: Infinity,
            }
        );
        // Start with the CD animation paused
        cdAnimation.pause();
        return cdAnimation;
    },

    _escapeHTML(html) {
        if (typeof html !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },
};

app.start();
