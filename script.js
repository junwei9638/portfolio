gsap.registerPlugin(ScrollTrigger);

// 1. Hero Title Animation
let heroTl = gsap.timeline();
heroTl.from(".title", { opacity: 0, y: 50, duration: 1 })
      .from(".subtitle", { opacity: 0, y: 30, duration: 1 }, "-=0.5");

// 2. Standard Panel Animation (Fade Up)
const panels = document.querySelectorAll('.panel');
panels.forEach(panel => {
  gsap.from(panel, {
    opacity: 0,
    y: 80,
    duration: 1,
    scrollTrigger: {
      trigger: panel,
      start: "top 85%",
    }
  });
});

// 3. Video Audio Control (Auto-play sound on scroll)
const video = document.getElementById('danceVideo');

ScrollTrigger.create({
  trigger: "#activities",
  start: "top 60%", // 當 Activities 區塊頂部到達視窗 60% 高度時觸發
  end: "bottom 40%",
  
  // 進入區塊時：播放並開聲音
  onEnter: () => playVideoWithSound(),
  onEnterBack: () => playVideoWithSound(),
  
  // 離開區塊時：暫停
  onLeave: () => pauseVideo(),
  onLeaveBack: () => pauseVideo(),
});

function playVideoWithSound() {
  if(video) {
    video.currentTime = 0; // (選用) 每次都從頭開始跳
    video.muted = false;   // 取消靜音
    
    // 瀏覽器可能會擋自動播放聲音，使用 Promise 處理錯誤
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(_ => {
        // 播放成功
        console.log("Video playing with sound");
      })
      .catch(error => {
        // 播放失敗 (通常是因為使用者還沒點擊過網頁)
        console.log("Autoplay blocked by browser. User interaction needed.");
        // 降級處理：先靜音播放，讓畫面至少有在動
        video.muted = true;
        video.play();
      });
    }
  }
}

function pauseVideo() {
  if(video) {
    video.pause();
  }
}