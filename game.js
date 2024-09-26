const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const blockSize = 40;
const gridWidth = 10;
let gridHeight = 7;

let blocks = [];
let score = 0;
let timeLeft = 300;
let isGameRunning = false;
let combo = 0;
let lastClickedType = null;
let gameInterval;
let lives = 3;
let currentLevel = 0;

const blockTypes = ['stone', 'coal', 'iron', 'gold', 'diamond', 'emerald', 'redstone', 'obsidian'];
const blockColors = {
    'stone': '#808080',
    'coal': '#333333',
    'iron': '#C0C0C0',
    'gold': '#FFD700',
    'diamond': '#00FFFF',
    'emerald': '#50C878',
    'redstone': '#FF0000',
    'obsidian': '#4A0E4E'
};
const blockValues = {
    'stone': 1,
    'coal': 5,
    'iron': 10,
    'gold': 25,
    'diamond': 50,
    'emerald': 75,
    'redstone': 100,
    'obsidian': 150
};

const startGameButton = document.getElementById('start-game-button');
const returnTopButton = document.getElementById('return-top-button');

const levels = [
    { timeLimit: 180, fallingSpeedMultiplier: 1, oreDistribution: {stone: 0.5, coal: 0.3, iron: 0.1, gold: 0.05, diamond: 0.03, emerald: 0.01, redstone: 0.01}, objective: 500 },
    { timeLimit: 150, fallingSpeedMultiplier: 1.2, oreDistribution: {stone: 0.4, coal: 0.35, iron: 0.15, gold: 0.06, diamond: 0.03, emerald: 0.01, redstone: 0.01}, objective: 1000 },
    { timeLimit: 120, fallingSpeedMultiplier: 1.5, oreDistribution: {stone: 0.3, coal: 0.3, iron: 0.2, gold: 0.1, diamond: 0.05, emerald: 0.03, redstone: 0.02}, objective: 1500 }
];

function showTutorial() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('欢迎来到 Minecraft 挖矿游戏!', canvas.width / 2, 50);
    ctx.font = '18px Arial';
    ctx.fillText('点击方块来挖矿', canvas.width / 2, 100);
    ctx.fillText('连续挖同一种矿石可以获得连击加成', canvas.width / 2, 130);
    ctx.fillText('完成目标分数来进入下一关', canvas.width / 2, 160);
    ctx.fillText('点击任意位置开始游戏', canvas.width / 2, 220);
    
    canvas.addEventListener('click', startGameAfterTutorial, { once: true });
}

function startGameAfterTutorial() {
    canvas.removeEventListener('click', startGameAfterTutorial);
    startGame();
}

function initializeBlocks() {
    blocks = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            blocks.push({
                x: x * blockSize,
                y: y * blockSize,
                type: getRandomBlockType(),
                mined: false,
                wobble: Math.random() * Math.PI * 2,
                velocityY: 0,
                breakingProgress: 0
            });
        }
    }
}

function getRandomBlockType() {
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const [type, probability] of Object.entries(levels[currentLevel].oreDistribution)) {
        cumulativeProbability += probability;
        if (rand < cumulativeProbability) {
            return type;
        }
    }
    return 'stone'; // 默认返回石头
}

function drawBlocks() {
    blocks.forEach(block => {
        if (!block.mined) {
            ctx.fillStyle = blockColors[block.type];
            const wobbleX = Math.sin(block.wobble) * 2;
            ctx.fillRect(block.x + wobbleX, block.y, blockSize, blockSize);
            
            // 绘制方块纹理
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(block.x + wobbleX + 5, block.y + 5, blockSize - 10, blockSize - 10);
            
            // 绘制破碎效果
            if (block.breakingProgress > 0) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                for (let i = 0; i < block.breakingProgress; i++) {
                    const startX = block.x + wobbleX + Math.random() * blockSize;
                    const startY = block.y + Math.random() * blockSize;
                    const endX = startX + (Math.random() - 0.5) * 10;
                    const endY = startY + (Math.random() - 0.5) * 10;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            ctx.strokeStyle = 'black';
            ctx.strokeRect(block.x + wobbleX, block.y, blockSize, blockSize);
        }
    });
}

function handleClick(event) {
    if (!isGameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let clickedBlock = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        if (!block.mined && x >= block.x && x < block.x + blockSize &&
            y >= block.y && y < block.y + blockSize) {
            clickedBlock = block;
            break;
        }
    }

    if (clickedBlock) {
        mineBlock(clickedBlock);
    }

    updateGame();
}

function mineBlock(block) {
    if (block.mined) return;

    block.breakingProgress++;
    if (block.breakingProgress >= 3) {
        let points = blockValues[block.type];
        
        if (block.type === lastClickedType) {
            combo++;
            points *= (1 + combo * 0.1); // 10% bonus per combo
        } else {
            combo = 0;
        }
        
        score += Math.round(points);
        lastClickedType = block.type;

        // 特殊效果
        if (block.type === 'redstone') {
            timeLeft += 10; // 额外10秒
        } else if (block.type === 'emerald') {
            score += Math.round(score * 0.1); // 额外10%分数
        } else if (block.type === 'obsidian') {
            lives++; // 额外一条生命
        }

        block.mined = true;

        // 向下移动上方的方块
        let columnBlocks = blocks.filter(b => b.x === block.x && b.y < block.y);
        columnBlocks.forEach(b => {
            b.velocityY = 2 + Math.random() * 3 * levels[currentLevel].fallingSpeedMultiplier;
        });

        // 在顶部添加新的方块
        blocks.push({
            x: block.x,
            y: -blockSize,
            type: getRandomBlockType(),
            mined: false,
            wobble: Math.random() * Math.PI * 2,
            velocityY: 2 + Math.random() * 3 * levels[currentLevel].fallingSpeedMultiplier,
            breakingProgress: 0
        });

        // 移除超出画布的方块
        blocks = blocks.filter(b => b.y < canvas.height);

        // 显示得分动画
        showScoreAnimation(Math.round(points), block.x, block.y);
    }
}

function showScoreAnimation(points, x, y) {
    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`+${points}`, x, y);
    
    setTimeout(() => {
        updateGame();
    }, 500);
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    blocks.forEach(block => {
        if (!block.mined) {
            block.y += block.velocityY;
            block.velocityY += 0.2 * levels[currentLevel].fallingSpeedMultiplier;
            
            // 检测碰撞
            const blockBelow = blocks.find(b => b !== block && b.x === block.x && b.y > block.y && b.y - block.y <= blockSize);
            if (blockBelow) {
                block.y = blockBelow.y - blockSize;
                block.velocityY = 0;
            } else if (block.y + blockSize > canvas.height) {
                block.y = canvas.height - blockSize;
                block.velocityY = 0;
            }
            
            block.wobble += 0.1;
        }
    });

    drawBlocks();
    drawScore();
    drawTimer();
    drawCombo();
    drawLives();
    drawLevelInfo();

    if (timeLeft <= 0) {
        if (score >= levels[currentLevel].objective) {
            levelComplete();
        } else if (lives > 0) {
            lives--;
            timeLeft = levels[currentLevel].timeLimit;
            initializeBlocks();
        } else {
            gameOver();
        }
    }

    if (score >= levels[currentLevel].objective) {
        levelComplete();
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('得分: ' + score, 10, 30);
}

function drawTimer() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('时间: ' + Math.floor(timeLeft / 60) + ':' + (timeLeft % 60).toString().padStart(2, '0'), canvas.width - 10, 30);
}

function drawCombo() {
    if (combo > 0) {
        ctx.fillStyle = 'yellow';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('连击: x' + (combo + 1), canvas.width / 2, 30);
    }
}

function drawLives() {
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('生命: ' + lives, 10, 60);
}

function drawLevelInfo() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('关卡: ' + (currentLevel + 1), canvas.width - 10, 60);
    ctx.fillText('目标: ' + levels[currentLevel].objective, canvas.width - 10, 90);
}

function startGame() {
    console.log("Starting game...");
    isGameRunning = true;
    score = 0;
    timeLeft = levels[currentLevel].timeLimit;
    combo = 0;
    lastClickedType = null;
    lives = 3;
    initializeBlocks();
    updateGame();
    if (startGameButton) startGameButton.style.display = 'none';
    if (returnTopButton) returnTopButton.style.display = 'none';
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        timeLeft--;
        updateGame();
    }, 1000 / 60); // 60 FPS
}

function levelComplete() {
    currentLevel++;
    if (currentLevel < levels.length) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('恭喜! 进入下一关!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('点击继续', canvas.width / 2, canvas.height / 2 + 20);
        
        canvas.addEventListener('click', startNextLevel, { once: true });
    } else {
        gameWon();
    }
}

function startNextLevel() {
    timeLeft = levels[currentLevel].timeLimit;
    initializeBlocks();
    updateGame();
}

function gameWon() {
    isGameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜通关!', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('最终得分: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    if (gameInterval) clearInterval(gameInterval);
    if (startGameButton) startGameButton.style.display = 'inline-block';
    if (returnTopButton) returnTopButton.style.display = 'inline-block';
    
    // 保存高分
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
        localStorage.setItem('highScore', score);
        ctx.fillText('新高分!', canvas.width / 2, canvas.height / 2 + 50);
    }
}

function gameOver() {
    isGameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2 - 70, canvas.height / 2 - 45);
    ctx.fillText('最终得分: ' + score, canvas.width / 2 - 80, canvas.height / 2 - 5);
    ctx.fillText('关卡: ' + (currentLevel + 1), canvas.width / 2 - 80, canvas.height / 2 + 35);
    if (gameInterval) clearInterval(gameInterval);
    if (startGameButton) startGameButton.style.display = 'inline-block';
    if (returnTopButton) returnTopButton.style.display = 'inline-block';
    
    // 保存高分
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
        localStorage.setItem('highScore', score);
        ctx.fillText('新高分!', canvas.width / 2 - 50, canvas.height / 2 + 75);
    }
}

function initGame() {
    console.log("Initializing game...");
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
        console.log("Start game button listener added");
    } else {
        console.error("Start game button not found");
    }
    if (returnTopButton) {
        returnTopButton.addEventListener('click', () => {
            window.scrollTo(0, 0);
            location.reload();
        });
        console.log("Return top button listener added");
    } else {
        console.error("Return top button not found");
    }
    canvas.addEventListener('click', handleClick);
    console.log("Canvas click listener added");
    console.log("Game initialized");
    
    // 显示高分
    const highScore = localStorage.getItem('highScore') || 0;
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('最高分: ' + highScore, canvas.width - 120, 60);
}

document.addEventListener('DOMContentLoaded', initGame);