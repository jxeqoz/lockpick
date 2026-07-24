let minRot = -90,
  maxRot = 90,
  solveDeg = Math.random() * 180 - 90,
  solvePadding = 4,
  maxDistFromSolve = 45,
  pinRot = 0,
  cylRot = 0,
  lastMousePos = 0,
  mouseSmoothing = 2,
  keyRepeatRate = 25,
  cylRotSpeed = 3,
  pinDamage = 20,
  pinHealth = 100,
  pinDamageInterval = 150,
  numPins = 5,
  userPushingCyl = false,
  gameOver = false,
  gamePaused = false,
  pin,
  cyl,
  driver,
  cylRotationInterval,
  pinLastDamaged,
  gameToken;

$(function () {
  pin = $('#pin');
  cyl = $('#cylinder');
  driver = $('#driver');

  $('body').on('mousemove', function (e) {
    if (lastMousePos && !gameOver && !gamePaused) {
      var pinRotChange = (e.clientX - lastMousePos) / mouseSmoothing;
      pinRot += pinRotChange;
      pinRot = Util.clamp(pinRot, maxRot, minRot);
      pin.css({
        transform: 'rotateZ(' + pinRot + 'deg)',
      });
    }
    lastMousePos = e.clientX;
  });
  $('body').on('mouseleave', function (e) {
    lastMousePos = 0;
  });

  $('body').on('keydown', function (e) {
    if (
      (e.keyCode == 87 ||
        e.keyCode == 65 ||
        e.keyCode == 83 ||
        e.keyCode == 68 ||
        e.keyCode == 37 ||
        e.keyCode == 39) &&
      !userPushingCyl &&
      !gameOver &&
      !gamePaused
    ) {
      pushCyl();
    }
  });

  $('body').on('keyup', function (e) {
    if (
      (e.keyCode == 87 ||
        e.keyCode == 65 ||
        e.keyCode == 83 ||
        e.keyCode == 68 ||
        e.keyCode == 37 ||
        e.keyCode == 39) &&
      !gameOver
    ) {
      unpushCyl();
    }
  });
});

function pushCyl() {
  var distFromSolve, cylRotationAllowance;
  clearInterval(cylRotationInterval);
  userPushingCyl = true;

  distFromSolve = Math.abs(pinRot - solveDeg) - solvePadding;
  distFromSolve = Util.clamp(distFromSolve, maxDistFromSolve, 0);

  cylRotationAllowance = Util.convertRanges(
    distFromSolve,
    0,
    maxDistFromSolve,
    1,
    0.02
  );
  cylRotationAllowance = cylRotationAllowance * maxRot;

  cylRotationInterval = setInterval(function () {
    cylRot += cylRotSpeed;
    if (cylRot >= maxRot) {
      cylRot = maxRot;
      clearInterval(cylRotationInterval);
      unlock();
    } else if (cylRot >= cylRotationAllowance) {
      cylRot = cylRotationAllowance;
      damagePin();
    }

    cyl.css({
      transform: 'rotateZ(' + cylRot + 'deg)',
    });
    driver.css({
      transform: 'rotateZ(' + cylRot + 'deg)',
    });
  }, keyRepeatRate);
}

function unpushCyl() {
  userPushingCyl = false;
  clearInterval(cylRotationInterval);
  cylRotationInterval = setInterval(function () {
    cylRot -= cylRotSpeed;
    cylRot = Math.max(cylRot, 0);
    cyl.css({
      transform: 'rotateZ(' + cylRot + 'deg)',
    });
    driver.css({
      transform: 'rotateZ(' + cylRot + 'deg)',
    });
    if (cylRot <= 0) {
      cylRot = 0;
      clearInterval(cylRotationInterval);
    }
  }, keyRepeatRate);
}

function damagePin() {
  if (!pinLastDamaged || Date.now() - pinLastDamaged > pinDamageInterval) {
    var tl = new TimelineLite();
    pinHealth -= pinDamage;
    pinLastDamaged = Date.now();

    tl.to(pin, pinDamageInterval / 4 / 1000, {
      rotationZ: pinRot - 2,
    });
    tl.to(pin, pinDamageInterval / 4 / 1000, {
      rotationZ: pinRot,
    });
    if (pinHealth <= 0) {
      breakPin();
    }
  }
}

function breakPin() {
  var tl, pinTop, pinBott;
  gamePaused = true;
  clearInterval(cylRotationInterval);
  numPins--;
  pinTop = pin.find('.top');
  pinBott = pin.find('.bott');
  tl = new TimelineLite();
  tl.to(pinTop, 0.7, {
    rotationZ: -400,
    x: -200,
    y: -100,
    opacity: 0,
  });
  tl.to(
    pinBott,
    0.7,
    {
      rotationZ: 400,
      x: 200,
      y: 100,
      opacity: 0,
      onComplete: function () {
        if (numPins > 0) {
          gamePaused = false;
          reset();
        } else {
          outOfPins();
        }
      },
    },
    0
  );
  tl.play();
}

function reset() {
  cylRot = 0;
  pinHealth = 100;
  pinRot = 0;
  pin.css({
    transform: 'rotateZ(' + pinRot + 'deg)',
  });
  cyl.css({
    transform: 'rotateZ(' + cylRot + 'deg)',
  });
  driver.css({
    transform: 'rotateZ(' + cylRot + 'deg)',
  });
  TweenLite.to(pin.find('.top'), 0, {
    rotationZ: 0,
    x: 0,
    y: 0,
    opacity: 1,
  });
  TweenLite.to(pin.find('.bott'), 0, {
    rotationZ: 0,
    x: 0,
    y: 0,
    opacity: 1,
  });
}

function outOfPins() {
  gameOver = true;
  finish(false);
}

function unlock() {
  gameOver = true;
  finish(true);
}

Util = {};
Util.clamp = function (val, max, min) {
  return Math.min(Math.max(val, min), max);
};
Util.convertRanges = function (OldValue, OldMin, OldMax, NewMin, NewMax) {
  return ((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin) + NewMin;
};

window.addEventListener('message', function (event) {
  let data = event.data;

  if (data.start) {
    gameToken = data.token;
    $('#wrap').show();
    minRot = -90;
    maxRot = 90;
    solveDeg = Math.random() * 180 - 90;
    solvePadding = 4;
    maxDistFromSolve = 45;
    pinRot = 0;
    cylRot = 0;
    lastMousePos = 0;
    mouseSmoothing = 2;
    keyRepeatRate = 25;
    cylRotSpeed = 3;
    pinDamage = 20;
    pinHealth = 100;
    pinDamageInterval = 150;
    numPins = 5;
    userPushingCyl = false;
    gameOver = false;
    gamePaused = false;
    pin = $('#pin');
    cyl = $('#cylinder');
    driver = $('#driver');
    cylRotationInterval = null;
    pinLastDamaged = null;

    reset();
  }
});

function finish(success) {
  $('#wrap').hide();
  if (success) {
    $.post('https://lockpick/succeed', JSON.stringify({ token: gameToken }));
  } else {
    $.post('https://lockpick/failed', JSON.stringify({}));
  }
}

document.addEventListener('keyup', keyUpHandler);

function keyUpHandler(e) {
  if (e.code == 'Escape' && !gameOver) {
    gameOver = true;
    $('#wrap').hide();
    $.post('https://lockpick/close', JSON.stringify({}));
  }
}
