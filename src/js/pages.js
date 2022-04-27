import START from "../start.html"
import FOOTER from "../footer.html"
import END from "../ending.html"
import INSTRUCTIONS from "../instructions.html";


// idea from https://github.com/efyang/portal-0.5/blob/main/src/app.js
// https://github.com/efyang/portal-0.5/blob/main/src/instructions.html
export function init_page(document) {
    document.body.innerHTML = '';
    let menu = document.createElement('div');
    menu.id = 'menu';
    menu.innerHTML = START;
    document.body.appendChild(menu)

    let footer = document.createElement('div');
    footer.id = 'footer';
    footer.innerHTML = FOOTER;
    document.body.appendChild(footer)
}

export function quit(document, score) {
    let ending = document.createElement('div');
    ending.id = 'ending';
    ending.innerHTML = END;
    document.body.appendChild(ending)
    let finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = 'Score: '.concat(score);
    let canvas = document.getElementById("canvas");
    canvas.remove();
    let instructions = document.getElementById('instructions');
    instructions.remove();
}

export function start(document, canvas) {
    let menu = document.getElementById("menu");
    menu.remove();
    document.body.appendChild(canvas);
    let scoreCounter = document.getElementById('score');
    if (scoreCounter) {
        scoreCounter.remove();
    } else {
        scoreCounter = document.createElement('div');
        scoreCounter.id = 'score';
        document.body.appendChild(scoreCounter);
    }
    
    let instructions = document.createElement('div');
    instructions.id = 'instructions';
    instructions.innerHTML = INSTRUCTIONS;
    document.body.appendChild(instructions)
    let fillScreen = document.createElement('div');
    fillScreen.id = 'fillScreen';
    fillScreen.style.pointerEvents = "none";
    document.body.appendChild(fillScreen);
}
