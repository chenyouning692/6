let video;
let handpose;
let predictions = [];

let circles = [];
let score = 0;
let targetScore = 6;
let box;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // 確保 ml5.handpose 方法正確使用
  if (ml5 && ml5.handpose) {
    handpose = ml5.handpose(video, () => {
      console.log("Handpose ready!");
    });

    handpose.on("predict", results => predictions = results);
  } else {
    console.error("ml5.handpose is not available. Please check your ml5.js version or CDN link.");
  }

  // 初始化圈
  for (let i = 0; i < targetScore; i++) {
    let overlapping;
    let newCircle;
    do {
      overlapping = false;
      newCircle = {
        x: random(50, width - 50),
        y: random(50, height - 50),
        r: 30,
        inBox: false
      };

      for (let circle of circles) {
        if (dist(newCircle.x, newCircle.y, circle.x, circle.y) < newCircle.r * 2) {
          overlapping = true;
          break;
        }
      }
    } while (overlapping);

    circles.push(newCircle);
  }

  // 初始化計分框
  box = {
    x: width - 160,
    y: height - 160,
    w: 140,
    h: 140
  };
}

function draw() {
  image(video, 0, 0, width, height);

  // 繪製目標框
  noFill();
  stroke(255);
  strokeWeight(3);
  rect(box.x, box.y, box.w, box.h);

  // 繪製並檢查圈
  fill(139, 69, 19); // 咖啡色
  noStroke();

  score = 0;
  for (let circle of circles) {
    if (circle.inBox) {
      fill(255, 215, 0); // 如果圈已在框內，顯示金色
    } else {
      fill(139, 69, 19); // 否則顯示咖啡色
    }

    ellipse(circle.x, circle.y, circle.r * 2);

    // 檢查圈是否在框內
    if (
      circle.x > box.x &&
      circle.x < box.x + box.w &&
      circle.y > box.y &&
      circle.y < box.y + box.h
    ) {
      circle.inBox = true;
    }

    if (circle.inBox) score++;
  }

  // 繪製分數
  fill(255);
  textSize(24);
  textAlign(RIGHT, TOP);
  text(`${score}/${targetScore}`, width - 10, 10);

  // 繪製手掌關鍵點並檢查手指是否碰到圈
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;

    for (let pt of keypoints) {
      fill(0, 255, 255); // 青色
      noStroke();
      circle(pt[0], pt[1], 10);

      // 檢查手指是否碰到圈
      for (let circle of circles) {
        let d = dist(pt[0], pt[1], circle.x, circle.y);
        if (d < circle.r && !circle.inBox) {
          // 平滑移動圈到手指位置
          circle.x = lerp(circle.x, pt[0], 0.2);
          circle.y = lerp(circle.y, pt[1], 0.2);
        }
      }
    }
  }

  // 顯示勝利訊息
  if (score === targetScore) {
    fill(0, 255, 0); // 綠色
    textSize(32);
    textAlign(CENTER, CENTER);
    text("You Win!", width / 2, height / 2);
  }
}
