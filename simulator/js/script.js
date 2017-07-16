

// function getQuestion(r) {
//     var q = {};
//     q.question = r.children[1].innerText.trim();
//     q.answers = [
//         r.children[2].innerText.trim(),
//         r.children[3].innerText.trim(),
//         r.children[4].innerText.trim(),
//         r.children[5].innerText.trim(),
//     ];
//     q.correctAnswer = Array.prototype.findIndex.call(r.children, a => a.classList.contains('important')) - 2;
//     q.images = Array.prototype.map.call(r.children[1].querySelectorAll('img'), i => i.attributes['src'].value);

//     return q;
// }

// qs = [];
// Array.prototype.slice.call($0.rows, 1).forEach(r => { qs.push(getQuestion(r)); });

var TemplateEngine = function(html, options) {
    var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
    var add = function(line, js) {
        js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

function renderTemplate(templateId, data) {
    var templateHtml = $('#' + templateId).html();

    return TemplateEngine(templateHtml, data);
}

function getRandomItems(itemsArray, itemsCount)
{
    itemsArray = itemsArray.slice();
    for (i = itemsArray.length-1; i > 1  ; i--)
    {
        var r = Math.floor(Math.random()*i);
        var t = itemsArray[i];
        itemsArray[i] = itemsArray[r];
        itemsArray[r] = t;
    }

    return itemsArray.slice(0,itemsCount);
}

function shuffleArray(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function start() {
    generateExamQuestions();
    exam.questions.forEach(function(q) { q.selectedAnswer = undefined; })

    exam.ui.startScreen.hide();
    exam.ui.endScreen.hide();
    exam.ui.examScreen.show();

    exam.ui.nextButtons.show();
    exam.ui.prevButtons.show();

    var currentTime = new Date().getTime();
    var examEndTime = currentTime + 60000 * config.duration;

    exam.currentQuestionIndex = 0;
    onQuestionIndexChanged();

    exam.timer = startTimer(examEndTime, showLeftTime, completeExam);
}

function end() {
    clearInterval(exam.timer);
    completeExam();
}

function completeExam() {
    exam.ui.examScreen.hide();
    exam.ui.endScreen.show();

    var wrongAnswers = [];
    for (var questionIdex in exam.questions) {
        var question = exam.questions[questionIdex];
        if (question.correctAnswer != question.selectedAnswer) {
            wrongAnswers.push(question);
        }
    }

    var correctAnswersCount = exam.questions.length - wrongAnswers.length;
    var wrongAnswersCount = wrongAnswers.length;
    
    exam.ui.correctAnswersCount.text(correctAnswersCount);
    exam.ui.wrongAnswersCount.text(wrongAnswersCount);
    exam.ui.outcomeText.removeClass('correct').removeClass('wrong');
    if (correctAnswersCount < config.correctAnswers) {
        exam.ui.outcomeText.addClass('wrong').text('Неуспешен изпит!');
    }
    else {
        exam.ui.outcomeText.addClass('correct').text('Успешен изпит!');
    }

    if (wrongAnswersCount > 0) {
        var wrongAnswersHtml = renderTemplate('template-wrong-answers', wrongAnswers);
        exam.ui.wrongAnswersHolder.html(wrongAnswersHtml).show();
    }
    else {
        exam.ui.wrongAnswersHolder.hide();
    }
}

function startTimer(endTime, tickCallback, endCallback) {
    var x = setInterval(function() {
        var now = new Date().getTime();
        var leftTime = endTime - now;

        if (leftTime <= 0) {
            clearInterval(x);
            endCallback();
        }
        else {
            tickCallback(leftTime);
        }
    }, 1000);

    return x;
}

function generateExamQuestions() {
    exam.questions = [];
    config.categories.forEach(function (c) {
        var questionsInCategory = questions[c.name];
        var questionsFromCategory = getRandomItems(questionsInCategory, c.questions);

        exam.questions.push.apply(exam.questions, questionsFromCategory);
    });

    shuffleArray(exam.questions);
}

function showLeftTime(leftTime) {
    var days = Math.floor(leftTime / (1000 * 60 * 60 * 24));
    var hours = Math.floor((leftTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((leftTime % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((leftTime % (1000 * 60)) / 1000);

    var leftTimeString = "";
    if (days) leftTimeString += (" " + days + " дни");
    if (hours) leftTimeString += (" " + hours + " часа");
    if (minutes) leftTimeString += (" " + minutes + " минути");
    leftTimeString += (" " + seconds + " секунди");

    exam.ui.timer.text(leftTimeString);
}

function onQuestionIndexChanged() {
    var questionsCount = exam.questions.length;
    if (exam.currentQuestionIndex == 0) {
        exam.ui.prevButtons.hide();
    }
    else if (exam.currentQuestionIndex == 1) {
        exam.ui.prevButtons.show();
    }

    if (exam.currentQuestionIndex == questionsCount - 1) {
        exam.ui.nextButtons.hide();
    }
    else if (exam.currentQuestionIndex == questionsCount - 2) {
        exam.ui.nextButtons.show();
    }

    exam.ui.questionIndex.text((exam.currentQuestionIndex + 1) + " от " + questionsCount);

    var currentQuestion = exam.questions[exam.currentQuestionIndex];
    displayQuestion(currentQuestion);
}

function displayQuestion(question) {
    exam.ui.questionText.text(question.question);
    if (question.images && question.images.length) {
        var imagesHtml = renderTemplate('template-images', question.images);
        exam.ui.questionImages.html(imagesHtml).show();
    }
    else {
        exam.ui.questionImages.hide();
    }

    var answersHtml = renderTemplate('template-answers', question);
    exam.ui.questionAnswers.html(answersHtml);
}

function onAnswerSelected(answerIndex) {
    var currentQuestion = exam.questions[exam.currentQuestionIndex];
    currentQuestion.selectedAnswer = answerIndex;
}

function initialize() {
    exam = {};
    exam.ui = {};

    var $body = $('body');
    $body.on("click", ".start-exam", function (e) { e.preventDefault(); start(); });
    $body.on("click", ".end-exam", function (e) { e.preventDefault(); end(); });
    $body.on("click", ".next-question", function (e) { e.preventDefault(); exam.currentQuestionIndex++; onQuestionIndexChanged(); });
    $body.on("click", ".prev-question", function (e) { e.preventDefault(); exam.currentQuestionIndex--; onQuestionIndexChanged(); });

    exam.ui.startScreen = $('.screen--start');
    exam.ui.examScreen = $('.screen--exam');
    exam.ui.endScreen = $('.screen--end');

    exam.ui.questionIndex = $('.question-index');
    exam.ui.timer = $('.timer');

    exam.ui.nextButtons = $('.next-question');
    exam.ui.prevButtons = $('.prev-question');

    exam.ui.questionText = $('.question-text');
    exam.ui.questionImages = $('.question-images');
    exam.ui.questionAnswers = $('.question-answers');
    exam.ui.questionAnswers.on('change', 'input[type=radio]', function () { onAnswerSelected(parseInt(this.value)); });

    exam.ui.outcomeText = $('.outcome-text');
    exam.ui.correctAnswersCount = $('.correct-answers-count');
    exam.ui.wrongAnswersCount = $('.wrong-answers-count');
    exam.ui.wrongAnswersHolder = $('.wrong-answers-holder');

    exam.ui.examScreen.hide();
    exam.ui.endScreen.hide();
}

initialize();