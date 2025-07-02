// === GLOBAL DOM SHORTCUTS ===
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const musicPlayer = {
    // === CONSTANTS & SETTINGS ===
    NEXT_SONG: 1,
    PREVIOUS_SONG: -1,
    RESET_TIME_THRESHOLD: 2, // Thời gian tối thiểu (giây) để reset bài hiện tại thay vì chuyển bài trước

    STORAGE_SETTINGS: {
        LOOP_MODE: 'musicPlayer_loopMode',
        RANDOM_MODE: 'musicPlayer_randomMode',
        PLAY_COUNTS: 'musicPlayer_playCounts',
        FAVORITE_SONGS: 'musicPlayer_favoriteSongs',
    },

    // === DOM ELEMENTS ===
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
    drawerMenu: $('.drawer-menu'),
    subMenu: $('.sub-menu'),

    // === DATA ===
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

    // === STATE VARIABLES ===
    currentSongIndex: 0,
    isPlaying: false,
    isLoopMode: false,
    isRandomMode: false,
    hasTrackedCurrentPlay: false,
    songPlayCounts: {},
    favoriteSongs: [],
    searchDebounceTimer: null,

    // === INITIALIZATION ===
    start() {
        this._loadPlayerState();

        // Set currentSongList to all songs at startup
        this.currentSongList = this.songs;

        this._loadSongDurations().then(() => {
            this._displayPlaylist(this.currentSongList);
        });

        // Load the 1st song on UI when musicPlayer start
        this._loadCurrentSong();

        this._setupSearchHandlers();

        this._setupDrawerMenu();

        this._setupMusicPlayerHandlers();

        this._boundHandleGlobalClick =
            this._handleGlobalDocumentClick.bind(this);
        document.addEventListener('click', this._boundHandleGlobalClick);
    },

    // === UI HANDLERS ===
    // --- Drawer/Menu ---
    _setupDrawerMenu() {
        this.drawerMenu.onclick = (e) => {
            e.stopPropagation();
            this.subMenu.classList.toggle('active');
        };

        this.subMenu.onclick = (e) => {
            e.stopPropagation();
            const clickedThemeOption = e.target.closest('.theme-toggle');
            const clickedAllSongsOption = e.target.closest('.all-songs');
            const clickedFavoritesOption = e.target.closest('.favorites');

            if (clickedThemeOption) {
                document.body.classList.toggle('light-mode');
                return;
            }

            if (clickedAllSongsOption) {
                this.currentSongList = this.songs;
                this.currentSongIndex = -1; // Không bài nào được active sẵn
                this._displayPlaylist(this.currentSongList);
                this.subMenu.classList.remove('active');
                return;
            }

            if (clickedFavoritesOption) {
                const listOfFavoriteSongs = this.favoriteSongs.map(
                    (favoriteIndex) => {
                        return {
                            ...this.songs[favoriteIndex],
                            originalIndex: favoriteIndex,
                        };
                    }
                );

                this.currentSongList = listOfFavoriteSongs;
                this.currentSongIndex = -1; // Không bài nào được active sẵn
                this._displayPlaylist(this.currentSongList);
                this.subMenu.classList.remove('active');
            }
        };
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

        this.favoriteSongs =
            JSON.parse(
                localStorage.getItem(this.STORAGE_SETTINGS.FAVORITE_SONGS)
            ) ?? [];
    },

    // === SEARCH HANDLERS ===
    _setupSearchHandlers() {
        this.searchBtn.onclick = this._handleSearchButtonClick.bind(this);
        this.searchInput.onclick = (e) => e.stopPropagation(); // ⛔️ Stop event bubbling to dashboard
        this.searchInput.oninput = this._handleSearchInput.bind(this);
        this.searchInput.onkeydown = this._handleSearchEscapeKey.bind(this);
    },

    _handleSearchButtonClick(e) {
        e.stopPropagation();
        this.searchInput.classList.add('active');
        this.searchBtn.classList.add('hidden');
        this.drawerMenu.style.display = 'none';
        this.searchInput.focus();
    },

    _handleSearchInput() {
        const keyword = this.searchInput.value.toLowerCase();

        clearTimeout(this.searchDebounceTimer);

        // Use debounce to avoid triggering search too often while typing
        // Set a new timeout to delay the search execution
        this.searchDebounceTimer = setTimeout(() => {
            const searchList = this.songs.filter((song) => {
                const songName = this._removeVietnameseTones(
                    song.name.toLowerCase().trim()
                );

                const singerName = this._removeVietnameseTones(
                    song.singer.toLowerCase().trim()
                );

                return (
                    songName.includes(keyword) || singerName.includes(keyword)
                );
            });

            this._displayPlaylist(searchList);
        }, 300); // The search only runs after the user stops typing 300ms
    },

    _handleSearchEscapeKey(e) {
        if (e.key === 'Escape') {
            this._resetSearchInput();
        }
    },

    _resetSearchInput() {
        this.searchInput.classList.remove('active');
        this.searchBtn.classList.remove('hidden');
        this.searchInput.value = '';
        this.drawerMenu.style.display = 'flex';
        this._displayPlaylist(this.currentSongList);
    },

    // Remove Vietnamese diacritical marks (accents) from characters
    _removeVietnameseTones(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
            .replace(/đ/g, 'd') // đ → d
            .replace(/Đ/g, 'D'); // Đ → D
    },

    // === MUSIC PLAYER HANDLERS ===
    _setupMusicPlayerHandlers() {
        const cdRotation = this._setupCdRotation();
        const cdWidth = this.cd.offsetWidth;

        // Handle CD zoom in/ out
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

        // NEXT/ PREVIOUS/ REPEAT/ RANDOM
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

        // ASSIGN EVENT CLICK ON EACH SONG
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
        const clickedOption = e.target.closest('.option');
        const clickedSongItem = e.target.closest('.song');

        if (clickedOption) {
            this._handleSongOptionClick(clickedOption);
            return;
        }

        if (clickedSongItem) {
            this._handleSongItemClick(clickedSongItem);
        }
    },

    _handleSongOptionClick(optionElement) {
        const heartIcon = optionElement.querySelector('.fa-heart');
        heartIcon.classList.toggle('active');

        const parentSongItem = optionElement.closest('.song');
        if (!parentSongItem) return;

        const songIndex = +parentSongItem.dataset.index;

        // Check mảng đã có favorite song chưa
        const isAlreadyFavorited = this.favoriteSongs.includes(songIndex);

        if (!isAlreadyFavorited) {
            // Chưa có thêm vào
            this.favoriteSongs.push(songIndex);
        } else {
            // Ngược lại bỏ ra
            this.favoriteSongs = this.favoriteSongs.filter(
                (favoriteIndex) => favoriteIndex !== songIndex
            );
        }

        localStorage.setItem(
            this.STORAGE_SETTINGS.FAVORITE_SONGS,
            JSON.stringify(this.favoriteSongs)
        );

        // Update the playlist display to reflect the new favorite status
        this._displayPlaylist(this.currentSongList);

        console.log(this.favoriteSongs);
    },

    _handleSongItemClick(songElement) {
        // Index của bài hát hiện tại trong currentSongList
        const indexInCurrentList = Array.from($$('.song')).indexOf(songElement);
        console.log(Array.from($$('.song')));

        if (indexInCurrentList === -1) return;

        if (this.currentSongIndex === indexInCurrentList) {
            this._togglePlayback();
        } else {
            this.currentSongIndex = indexInCurrentList;
            this.isPlaying = true;
            this._applySongChange();
        }
    },

    // === PROGRESS BAR/ SEEK ===
    _updateProgressBar() {
        // this.audioPlayer.duration will be NaN/ undefined if:
        // - The file hasn't finished loading
        // - The file is corrupted or doesn't exist
        // - The browser can't read the file format
        if (this.currentSongIndex === -1 || !this.audioPlayer.duration) return;

        const progressValue = Math.floor(
            (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
        );

        this.progressBar.value = progressValue;
        this.progressBar.style.setProperty(
            '--progress-value',
            `${progressValue}%`
        );

        this.currentTime.textContent = this._formatTime(
            this.audioPlayer.currentTime
        );

        this.totalTime.textContent = this._formatTime(
            this.audioPlayer.duration
        );

        // Play count tracking
        const song = this.currentSongList[this.currentSongIndex];
        const index = song.originalIndex ?? this.songs.indexOf(song);

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

    _seekAudio() {
        this.audioPlayer.currentTime =
            (this.progressBar.value / 100) * this.audioPlayer.duration;
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

    // === SONG NAVIGATION, MODES, PLAYBACK ===

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
        if (this.currentSongList.length === 1) return this.currentSongIndex;

        let randomIndex = null;
        do {
            randomIndex = Math.floor(
                Math.random() * this.currentSongList.length
            );
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
        // Sử dụng currentSongList thay vì this.songs để tính chỉ số
        this.currentSongIndex =
            (this.currentSongIndex + this.currentSongList.length) %
            this.currentSongList.length;

        this._loadCurrentSong();
        this._updateActiveSong();
    },

    _updateActiveSong() {
        const songElements = $$('.song');
        songElements.forEach((songElement, index) => {
            songElement.classList.toggle(
                'active',
                index === this.currentSongIndex
            );
        });
        this._scrollToActiveSong();
    },

    // Call play/ pause
    _togglePlayback() {
        this.audioPlayer.paused
            ? this.audioPlayer.play()
            : this.audioPlayer.pause();
    },

    // === SONG INFO/ LOADERS ===
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
        return this.currentSongList[this.currentSongIndex];
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

    _displayPlaylist(songList) {
        // Nếu đang ở chế độ "Favorites" và danh sách rỗng
        if (this.currentSongList !== this.songs && songList.length === 0) {
            this._showEmptyFavoritesMessage();
        } else {
            this._renderSongItems(songList);
        }
        this._scrollToActiveSong();
    },

    _showEmptyFavoritesMessage() {
        const emptyMessage = `
        <div class="empty-favorites">
            <i class="fas fa-heart-broken"></i>
            <h3>No favorite songs yet!</h3>
            <p>Add some by tapping the heart icon on your favorite tracks.</p>
        </div>
    `;
        this.playList.innerHTML = emptyMessage;
    },

    _renderSongItems(songList) {
        const html = songList
            .map((song, index) => {
                const isActive = index === this.currentSongIndex;

                return `
                <div class="song ${isActive ? 'active' : ''}" data-index="${
                    song.originalIndex ?? index
                }">
                    <div class="thumb" style="background-image: url('${this._escapeHTML(
                        song.image
                    )}');"></div>
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
                                song.originalIndex ?? index
                            )} plays</span>
                        </div>
                    </div>
                    <div class="option">
                        <i class="fas fa-heart ${
                            this.favoriteSongs.includes(
                                song.originalIndex ?? index
                            )
                                ? 'active'
                                : ''
                        }"></i>
                    </div>
                </div>
            `;
            })
            .join('');

        this.playList.innerHTML = html;
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

    // === GLOBAL CLICK HANDLER ===
    _handleGlobalDocumentClick(e) {
        const clickedSearchInput = this.searchInput.contains(e.target);
        const clickedSearchBtn = this.searchBtn.contains(e.target);
        const clickedSubMenu = this.subMenu.contains(e.target);
        const clickedDrawerMenu = this.drawerMenu.contains(e.target);

        // ✅ Reset Search
        if (!clickedSearchInput && !clickedSearchBtn) {
            this._resetSearchInput();
        }

        // ✅ Hide menu
        if (!clickedSubMenu && !clickedDrawerMenu) {
            this.subMenu.classList.remove('active');
        }
    },
};

musicPlayer.start();
