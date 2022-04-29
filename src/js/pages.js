import START from "../start.html"
import FOOTER from "../footer.html"
import END from "../ending.html"
import INSTRUCTIONS from "../instructions.html";
import PAUSE from "../pause.html"


// idea from https://github.com/efyang/portal-0.5/blob/main/src/app.js
// https://github.com/efyang/portal-0.5/blob/main/src/instructions.html
export function init_page(document, menuCanvas) {
    document.body.innerHTML = '';
    document.body.appendChild(menuCanvas);
    let menu = document.createElement('div');
    menu.id = 'menu';
    menu.innerHTML = START;
    document.body.appendChild(menu)

    let footer = document.createElement('div');
    footer.id = 'footer';
    footer.innerHTML = FOOTER;
    document.body.appendChild(footer)

    let audio = document.createElement('audio');
    audio.setAttribute('src','src/sounds/menu.wav');
    audio.id = 'audio'
    audio.loop = true;
    document.body.appendChild(audio)
}

export function quit(document, score) {
    let ending = document.createElement('div');
    ending.id = 'ending';
    ending.innerHTML = END;
    document.body.appendChild(ending)
    let finalScore = document.getElementById('finalScore');
    finalScore.innerHTML = 'Score: '.concat(score);

    let scoreComment = document.getElementById('scoreComment');
    if (score <5) scoreComment.innerHTML = 'Were you even trying?'
    else if (score < 15) scoreComment.innerHTML = 'You could do better.'
    else if (score < 30) scoreComment.innerHTML = 'Not too shabby.'
    else if (score < 45) scoreComment.innerHTML = 'Maybe you have potential after all.'
    else if (score < 60) scoreComment.innerHTML = 'You\'re a true pilot.'
    else if (score < 75) scoreComment.innerHTML = 'I\'m impressed!'
    else scoreComment.innerHTML = 'You have transcended the mortal realm.'

    document.getElementById('score').remove();
    document.getElementById("canvas").remove();
    document.getElementById('instructions').remove();
}

export function start(document, canvas) {
    document.getElementById("menu").remove();
    document.getElementById('menuCanvas').remove()
    document.body.appendChild(canvas);
    let scoreCounter = document.createElement('div');
    scoreCounter.id = 'score';
    scoreCounter.classList.add('audioFont')

    let reminders = document.createElement('div');
    reminders.id = 'reminders';
    reminders.innerHTML = INSTRUCTIONS;
    reminders.prepend(scoreCounter)
    document.body.appendChild(reminders)
    let fillScreen = document.createElement('div');
    fillScreen.id = 'fillScreen';
    fillScreen.style.pointerEvents = "none";
    document.body.appendChild(fillScreen);
    let pause = document.createElement('div');
    pause.id = 'pause';
    pause.style.pointerEvents = 'none';
    pause.innerHTML = PAUSE;
    pause.classList.add('invisible')
    document.body.appendChild(pause)
    

}
