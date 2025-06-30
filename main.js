/**
 * 1. Set constant for local storage: theme, volume, isMuted
 * 2. Display time for each song dynamically ✅
 * 3. 3 dots -> context menu -> delete, favorite, theme switch (dark/light)
 * 5.logic when press ESC to exist input ✅
 *
 */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const musicPlayer = {
    // Constants
    NEXT_SONG: 1,
    PREVIOUS_SONG: -1,
    RESET_TIME_THRESHOLD: 2, // Thời gian tối thiểu (giây) để reset bài hiện tại thay vì chuyển bài trước

    STORAGE_SETTINGS: {
        LOOP_MODE: 'musicPlayer_loopMode',
        RANDOM_MODE: 'musicPlayer_randomMode',
        PLAY_COUNTS: 'musicPlayer_playCounts',
    },

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
    currentTime: $('.currentTime'),
    totalTime: $('.totalTime'),
    searchBtn: $('.search-btn'),
    searchInput: $('.search-input'),
    dashboard: $('.dashboard'),

    // List of songs
    songs: [
        {
            name: 'Cầu Duyên',
            singer: 'Chị Đẹp',
            path: './assets/music/cau-duyen.mp3',
            image: './assets/img/cau-duyen.webp',
            duration: 0,
        },
        {
            name: 'Cầu Vồng Lấp Lánh',
            singer: 'Dương Hoàng Yến',
            path: './assets/music/cau-vong-lap-lanh.mp3',
            image: './assets/img/cau-vong-lap-lanh.jpeg',
            duration: 0,
        },
        {
            name: 'Có Chàng Trai Viết Lên Cây',
            singer: 'Phan Mạnh Quỳnh',
            path: './assets/music/co-chang-trai-viet-len-cay.mp3',
            image: './assets/img/co-chang-trai-viet-len-cay.jpeg',
            duration: 0,
        },
        {
            name: 'Đậm Đà',
            singer: 'Tóc Tiên',
            path: './assets/music/dam-da.mp3',
            image: './assets/img/dam-da.jpeg',
            duration: 0,
        },
        {
            name: 'Đưa Em Về Nhà',
            singer: 'Chillies',
            path: './assets/music/dua-em-ve-nha.mp3',
            image: './assets/img/dua-em-ve-nha.jpeg',
            duration: 0,
        },
        {
            name: 'May Mắn',
            singer: 'Bùi Lan Hương x Ái Phương',
            path: './assets/music/may-man.mp3',
            image: './assets/img/may-man.jpeg',
            duration: 0,
        },
        {
            name: 'Mê Muội',
            singer: 'Bùi Lan Hương',
            path: './assets/music/me-muoi.mp3',
            image: './assets/img/me-muoi.jpeg',
            duration: 0,
        },
        {
            name: 'Miền Mộng Mị',
            singer: 'AMEE x Tlinh',
            path: './assets/music/mien-mong-mi.mp3',
            image: './assets/img/mien-mong-mi.jpeg',
            duration: 0,
        },
        {
            name: 'Từng Là',
            singer: 'Vũ Cát Tường',
            path: './assets/music/tung-la.mp3',
            image: './assets/img/tung-la.jpeg',
            duration: 0,
        },
        {
            name: 'Vị Nhà',
            singer: 'Đen Vâu',
            path: './assets/music/vi-nha.mp3',
            image: './assets/img/vi-nha.jpeg',
            duration: 0,
        },
    ],

    // Player states
    currentSongIndex: 0,
    isPlaying: false,
    isLoopMode: false,
    isRandomMode: false,
    hasTrackedCurrentPlay: false,
    songPlayCounts: {},

    start() {
        this._loadPlayerState();

        this._loadSongDurations().then(() => {
            this._renderPlaylist(this.songs);
        });

        // Load the 1st song on UI when musicPlayer start
        this._loadCurrentSong();

        this._setupSearchHandlers();

        this._setupMusicPlayerHandlers();
    },

    // === LOAD STATE FROM LOCAL STORAGE ===
    _loadPlayerState() {
        this.isLoopMode =
            localStorage.getItem(this.STORAGE_SETTINGS.LOOP_MODE) === 'true';

        this.isRandomMode =
            localStorage.getItem(this.STORAGE_SETTINGS.RANDOM_MODE) === 'true';

        this.songPlayCounts =
            JSON.parse(
                localStorage.getItem(this.STORAGE_SETTINGS.PLAY_COUNTS)
            ) ?? {};
    },

    // === SEARCH HANDLERS ===
    _setupSearchHandlers() {
        this.searchBtn.onclick = this._handleSearchButtonClick.bind(this);

        this.searchInput.onclick = (e) => {
            e.stopPropagation(); // ⛔️ Ngăn sự kiện click lan tới dashboard
        };

        this.searchInput.oninput = this._handleSearchInput.bind(this);

        this.searchInput.onkeydown = this._handleSearchEscapeKey.bind(this);

        document.onclick = this._handleDocumentClick.bind(this);
    },

    _handleSearchButtonClick(e) {
        e.stopPropagation();
        this.searchInput.classList.add('active');
        this.searchBtn.classList.add('hidden');
        this.searchInput.focus();
    },

    _handleSearchEscapeKey(e) {
        if (e.key === 'Escape') {
            this._resetSearchInput();
        }
    },

    _handleSearchInput(e) {
        // Use debounce to avoid triggering search too often while typing
        let debounceTimer;

        this.searchInput.oninput = (e) => {
            const keyword = this.searchInput.value.toLowerCase();

            clearTimeout(debounceTimer); // Clear the previous timeout if the user is still typing

            // Set a new timeout to delay the search execution
            debounceTimer = setTimeout(() => {
                const searchList = this.songs.filter((song) => {
                    const songName = this._removeVietnameseTones(
                        song.name.toLowerCase()
                    );

                    const singerName = this._removeVietnameseTones(
                        song.singer.toLowerCase()
                    );

                    return (
                        songName.includes(keyword) ||
                        singerName.includes(keyword)
                    );
                });
                this._renderPlaylist(searchList);
            }, 300); // The search only runs after the user stops typing 300ms
        };
    },

    _handleDocumentClick(e) {
        const clickedSearchInput = this.searchInput.contains(e.target);
        const clickedSearchBtn = this.searchBtn.contains(e.target);

        if (!clickedSearchInput && !clickedSearchBtn) {
            this._resetSearchInput();
        }
    },

    _resetSearchInput() {
        this.searchInput.classList.remove('active');
        this.searchBtn.classList.remove('hidden');
        this.searchInput.value = '';
        this._renderPlaylist(this.songs);
    },

    // Remove Vietnamese diacritical marks (accents) from characters
    _removeVietnameseTones(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    // === MUSIC PLAYER HANDLERS ===
    _setupMusicPlayerHandlers() {
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
            this.hasTrackedCurrentPlay = false;
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

        // Assign event click on each song
        this.playList.onclick = this._onSongClick.bind(this);

        // ontimeupdate is triggered continuously when song is playing
        // it's used for update the current time of song when a song is played
        // Useful to apply for Progress bar
        this.audioPlayer.ontimeupdate = this._updateProgressBar.bind(this);

        // Handle rewind/fast forward when adjusting the progress bar
        this.progressBar.oninput = this._seekAudio.bind(this);

        // Auto move to next song when audioPlayer ends
        this.audioPlayer.onended = this._handleSongNavigation.bind(
            this,
            this.NEXT_SONG
        );
    },

    _onSongClick(e) {
        const optionElement = e.target.closest('.option');
        if (optionElement) return;

        const songElement = e.target.closest('.song');
        if (songElement) {
            const clickedIndex = +songElement.dataset.index;

            // Clicked on playing song -> toggle play/pause
            if (this.currentSongIndex === clickedIndex) {
                this._togglePlayback();
            } else {
                // Clicked on another song -> change new song -> apply song changed
                this.currentSongIndex = clickedIndex;
                this.isPlaying = true;
                this._applySongChange();
            }
        }
    },

    _updateProgressBar() {
        // this.audioPlayer.duration will be NaN/ undefined if:
        // - The file hasn't finished loading
        // - The file is corrupted or doesn't exist
        // - The browser can't read the file format
        if (!this.audioPlayer.duration) return;

        const progressValue = Math.floor(
            (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
        );

        this.progressBar.value = progressValue;
        this.progressBar.style.setProperty(
            '--progress-value',
            `${progressValue}%`
        );

        this.currentTime.textContent = this._formatTime(progressValue);
        this.totalTime.textContent = this._formatTime(
            this.audioPlayer.duration
        );

        const index = this.currentSongIndex;

        // Only count a play if all conditions below are met:
        // - User has listened to more than 80% of the song
        // - Current playback time is greater than 20 seconds (prevents cheating via skipping)
        // - The song hasn't already been counted during this play session
        if (
            progressValue > 80 &&
            this.audioPlayer.currentTime > 20 &&
            !this.hasTrackedCurrentPlay
        ) {
            // Increase the play count for this song by 1
            // If it's the first time the song is being played, start from 0
            this.songPlayCounts[index] = (this.songPlayCounts[index] || 0) + 1;

            // Once counted, we set `hasTrackedCurrentPlay = true` to avoid double counting
            this.hasTrackedCurrentPlay = true;

            // Save the updated play counts to localStorage
            localStorage.setItem(
                this.STORAGE_SETTINGS.PLAY_COUNTS,
                JSON.stringify(this.songPlayCounts)
            );
        }
    },

    _formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const hrsFormat = hrs > 0 ? `${hrs}:` : '';
        const minsFormat = hrs > 0 ? String(mins).padStart(2, '0') : mins;
        const secsFormat = String(secs).padStart(2, '0');

        return `${hrsFormat}${minsFormat}:${secsFormat}`;
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

    _setLoopMode() {
        this.audioPlayer.loop = this.isLoopMode;
        this.repeatBtn.classList.toggle('active', this.isLoopMode);
        localStorage.setItem(this.STORAGE_SETTINGS.LOOP_MODE, this.isLoopMode);
    },

    _setRandomMode() {
        this.randomBtn.classList.toggle('active', this.isRandomMode);
        localStorage.setItem(
            this.STORAGE_SETTINGS.RANDOM_MODE,
            this.isRandomMode
        );
    },

    _toggleLoopMode() {
        this.isLoopMode = !this.isLoopMode;
        this._setLoopMode();
    },

    _toggleRandomMode() {
        this.isRandomMode = !this.isRandomMode;
        this._setRandomMode();
    },

    _applySongChange() {
        // + this.songs.length -> avoid negative index/ exceed length
        this.currentSongIndex =
            (this.currentSongIndex + this.songs.length) % this.songs.length;
        this._loadCurrentSong();
        this._renderPlaylist(this.songs);
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
        this._setDashboardBackground(currentSong.image);

        this._setLoopMode();
        this._setRandomMode();

        // When the audioPlayer is ready to play (enough data has been loaded)
        // Check the current musicPlayer state
        // If the musicPlayer is currently playing, start playing the new song automatically
        // Otherwise, keep it paused
        this.audioPlayer.oncanplay = () => {
            this.hasTrackedCurrentPlay = false;
            if (this.isPlaying) {
                this.audioPlayer.play();
            }
        };
    },

    _getCurrentSong() {
        return this.songs[this.currentSongIndex];
    },

    _loadSongDurations() {
        const songDurations = this.songs.map((song, index) => {
            return new Promise((resolve) => {
                const tempAudio = new Audio();
                tempAudio.src = song.path;

                tempAudio.addEventListener('loadedmetadata', () => {
                    this.songs[index].duration = tempAudio.duration;
                    resolve();
                });

                tempAudio.addEventListener('error', () => {
                    this.songs[index].duration = 0;
                    resolve();
                });
            });
        });

        return Promise.all(songDurations);
    },

    _renderPlaylist(songList) {
        const html = songList
            .map((song, index) => {
                const isActive = index === this.currentSongIndex;

                return `
               <div class="song  ${
                   isActive ? 'active' : ''
               }" data-index=${index}>
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
                       <div class="author">
                            <span class="author-name">${this._escapeHTML(
                                song.singer
                            )}</span>
                            <span class="duration">${this._formatTime(
                                song.duration
                            )}</span>
                            <span class="plays">${this._getPlayCount(
                                index
                            )} plays</span>
                        </div>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `;
            })
            .join('');

        this.playList.innerHTML = html;

        this._scrollToActiveSong();
    },

    _setDashboardBackground(imageUrl) {
        const dashboardBg = $('.background-blur');
        dashboardBg.style.backgroundImage = `url('${imageUrl}')`;
    },

    _getPlayCount(index) {
        return this.songPlayCounts[index] || '0';
    },

    _scrollToActiveSong() {
        const activeSong = $('.song.active');
        if (activeSong) {
            activeSong.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
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

musicPlayer.start();
