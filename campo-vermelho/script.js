$(document).ready(function() {

  var $body,
      $document,
      $board,
      $grid,
      timer,
      time,
      unstarted;

  function _init() {
    // Cache some common DOM queries
    $document = $(document);
    $body = $('body');
    $body.addClass('loaded');

    // Start Minesweeper
    $board = $('#board');
    $grid = $('#grid');
    var $timer = $('#timer');
    var $mineCounter = $('#minecounter');
    var $levelSelect = $('#level');
    var levels = {
      'beginner': '9x9x10',
      'intermediate': '16x16x44',
      'expert': '16x30x99'
    };
    var level = $levelSelect.val() || 'beginner';
    var levelParams,
        rows,
        $rows,
        columns,
        cellCount,
        mines,
        freeCells,
        mineTally,
        pauseTime,
        beginnerHighScore = 999,
        intermediateHighScore = 999,
        expertHighScore = 999;

    var countColors = {0: '', 1: 'blue', 2: 'green', 3: 'red', 4: 'blue-dark', 5: 'maroon', 6: 'turquoise', 7: 'purple', 8: 'gray-dark'};

    time = 0;
    timer = false;
    unstarted = true;
    var statusIndicator = '<div class="status-indicator"></div>';

    function setLevel(levelKey) {
      level = levelKey;
      levelParams = levels[level];
      rows = parseInt(levelParams.split('x')[0]);
      columns = parseInt(levelParams.split('x')[1]);
      cellCount = rows * columns;
      mines = parseInt(levelParams.split('x')[2]);
      freeCells = cellCount - mines;
      mineTally = mines;
      updateMinecounter(mineTally);
    }

    function setBoard(levelKey) {
      // Clear Grid
      $grid.html(statusIndicator).removeClass('disabled lose win').addClass('unstarted');

      // Set Up Grid
      setLevel(levelKey);

      // Set unstarted
      unstarted = true;
      resetTimer();

      // Build Rows and Cells
      var boardHtml = '';
      for (var r = 0; r < rows; r++) {
        boardHtml += '<div class="row" data-row="' + r + '">';
        for (var c = 0; c < columns; c++) {
          boardHtml += '<div class="cell"></div>';
        }
        boardHtml += '</div>';
      }
      $grid.append(boardHtml);
      $rows = $grid.find('.row');
    }

    function layMines(levelKey, clickedCellIndex) {
      var freeCells = $('.cell').toArray();
      // Remove clicked cell from available mine positions to ensure first click is safe
      freeCells.splice(clickedCellIndex, 1);
      
      var takenCells = [];
      for (var m = 0; m < mines; m++) {
        var mineCell = Math.floor(Math.random() * freeCells.length);
        if (takenCells.indexOf(mineCell) > -1) {
          m--;
          continue;
        }
        takenCells.push(mineCell);
        $(freeCells[mineCell]).addClass('mine');
      }

      // Identify Cell Numbers
      var $cells = $('.cell');
      for (var c = 0; c < $cells.length; c++) {
        var $cell = $($cells[c]);
        $cell.attr('data-cell', c);
        // Skip if it's a mine
        if ($cell.is('.mine')) {
          continue;
        }

        var mineCount = 0;
        var rowPos = Math.floor(c / columns);
        var $currentRow = $cell.closest('.row');
        var rowCells = $currentRow.find('.cell');
        var cellPos = c % columns;

        if (cellPos > 0 && $(rowCells[cellPos - 1]).is('.mine')) {
          mineCount++;
        }
        if (cellPos < columns - 1 && $(rowCells[cellPos + 1]).is('.mine')) {
          mineCount++;
        }

        if (rowPos > 0) {
          var prevRowCells = $($rows[rowPos - 1]).find('.cell');
          if (cellPos > 0 && $(prevRowCells[cellPos - 1]).is('.mine')) {
            mineCount++;
          }
          if ($(prevRowCells[cellPos]).is('.mine')) {
            mineCount++;
          }
          if (cellPos < columns - 1 && $(prevRowCells[cellPos + 1]).is('.mine')) {
            mineCount++;
          }
        }

        if (rowPos < rows - 1) {
          var nextRowCells = $($rows[rowPos + 1]).find('.cell');
          if (cellPos > 0 && $(nextRowCells[cellPos - 1]).is('.mine')) {
            mineCount++;
          }
          if ($(nextRowCells[cellPos]).is('.mine')) {
            mineCount++;
          }
          if (cellPos < columns - 1 && $(nextRowCells[cellPos + 1]).is('.mine')) {
            mineCount++;
          }
        }

        if (mineCount > 0) {
          $cell.html('<i>' + mineCount + '</i>');
          var colorClass = countColors[mineCount];
          $cell.addClass(colorClass);
        } else {
          $cell.addClass('zero');
        }
      }
    }

    // Click cell to start game
    $document.off('click', '#grid.unstarted .cell').on('click', '#grid.unstarted .cell', function(e) {
      $grid.removeClass('unstarted');
      if (unstarted && !$(e.target).is('.mine')) {
        layMines(level, $('.cell').index(this));
        timer = window.setInterval(startTimer, 1000);
        unstarted = false;
      }
    });

    // Timer Functions
    function resetTimer() {
      stopTimer();
      $timer.html('000');
      time = 0;
    }

    function startTimer() {
      time++;
      if (time < 10) {
        $timer.html('00' + time);
      } else if (time >= 10 && time < 100) {
        $timer.html('0' + time);
      } else {
        $timer.html(time);
      }
    }

    function stopTimer() {
      window.clearInterval(timer);
    }

    function pauseTimer() {
      if (!unstarted) {
        stopTimer();
        pauseTime = parseInt($('#timer').html(), 10);
      }
    }

    function unpauseTimer() {
      time = pauseTime;
      timer = window.setInterval(startTimer, 1000);
      pauseTime = false;
    }

    // Pause when window loses focus
    $(window).on('blur', function() {
      if (!unstarted) pauseTimer();
    }).on('focus', function() {
      if (pauseTime) {
        unpauseTimer();
      }
    });

    // Check Cell
    function checkCell($cell) {
      if ($cell.length && !$cell.is('.mine') && !$cell.is('.revealed')) {
        cellClick($cell, 'reveal');

        if ($cell.is('.zero')) {
          zeroClick($cell);
        }
      }
    }

    // Clicking on a cell
    function cellClick($cell, action) {
      if (action === 'flag' && !$cell.is('.revealed')) {
        if ($cell.is('.flagged')) {
          $cell.removeClass('flagged').addClass('maybe');
          var flag = $cell.find('.flag');
          flag.remove();
          mineTally++;
          updateMinecounter(mineTally);
        } else if ($cell.is('.maybe')) {
          $cell.removeClass('maybe');
        } else {
          $cell.addClass('flagged').append('<span class="flag"></span>');
          mineTally--;
          updateMinecounter(mineTally);
        }
      } else if (action === 'reveal') {
        if ($cell.is('.flagged')) return;
        $cell.addClass('revealed');

        if ($cell.is('.mine')) {
          lose();
        } else {
          statusCheck();
        }
      } else if (action === 'clear') {
        if (!$cell.is('.revealed') || $cell.is('.zero')) {
          return;
        }
        clearClick($cell);
      }
    }

    // Update Minecounter
    function updateMinecounter(tally) {
      if (tally < 0) {
        $mineCounter.html(tally);
      } else if (tally < 10) {
        $mineCounter.html('0' + tally);
      } else {
        $mineCounter.html(tally);
      }
    }

    // Clicking on a Zero cell
    function zeroClick($cell) {
      var cellPos = $cell.index();
      var $currentRow = $cell.closest('.row');
      var rowPos = parseInt($currentRow.attr('data-row'), 10);
      var rowCells = $currentRow.find('.cell');

      if (cellPos > 0) checkCell($(rowCells[cellPos - 1]));
      if (cellPos < columns - 1) checkCell($(rowCells[cellPos + 1]));

      if (rowPos > 0) {
        var prevRowCells = $($rows[rowPos - 1]).find('.cell');
        if (cellPos > 0) checkCell($(prevRowCells[cellPos - 1]));
        checkCell($(prevRowCells[cellPos]));
        if (cellPos < columns - 1) checkCell($(prevRowCells[cellPos + 1]));
      }

      if (rowPos < rows - 1) {
        var nextRowCells = $($rows[rowPos + 1]).find('.cell');
        if (cellPos > 0) checkCell($(nextRowCells[cellPos - 1]));
        checkCell($(nextRowCells[cellPos]));
        if (cellPos < columns - 1) checkCell($(nextRowCells[cellPos + 1]));
      }
    }

    // Clicking on a number to clear free cells
    function clearClick($cell) {
      var cellPos = $cell.index();
      var $currentRow = $cell.closest('.row');
      var rowPos = parseInt($currentRow.attr('data-row'), 10);
      var rowCells = $currentRow.find('.cell');
      var adjacentCells = [];
      var correctClear = true;
      var adjacentMines = 0;
      var adjacentFlags = 0;
      var i;

      if (cellPos > 0) adjacentCells.push($(rowCells[cellPos - 1]));
      if (cellPos < columns - 1) adjacentCells.push($(rowCells[cellPos + 1]));

      if (rowPos > 0) {
        var prevRowCells = $($rows[rowPos - 1]).find('.cell');
        if (cellPos > 0) adjacentCells.push($(prevRowCells[cellPos - 1]));
        adjacentCells.push($(prevRowCells[cellPos]));
        if (cellPos < columns - 1) adjacentCells.push($(prevRowCells[cellPos + 1]));
      }

      if (rowPos < rows - 1) {
        var nextRowCells = $($rows[rowPos + 1]).find('.cell');
        if (cellPos > 0) adjacentCells.push($(nextRowCells[cellPos - 1]));
        adjacentCells.push($(nextRowCells[cellPos]));
        if (cellPos < columns - 1) adjacentCells.push($(nextRowCells[cellPos + 1]));
      }

      for (i = 0; i < adjacentCells.length; i++) {
        if ($(adjacentCells[i]).is('.mine')) {
          adjacentMines++;
        }
        if ($(adjacentCells[i]).is('.flagged')) {
          adjacentFlags++;
        }
      }

      if (adjacentFlags === adjacentMines) {
        for (i = 0; i < adjacentCells.length; i++) {
          var $adj = $(adjacentCells[i]);
          if ($adj.is('.mine')) {
            if ($adj.is('.flagged')) {
              continue;
            } else {
              $adj.addClass('revealed');
              correctClear = false;
            }
          } else if ($adj.is('.flagged')) {
            correctClear = false;
            $adj.addClass('incorrect');
            lose();
          }
        }

        if (correctClear) {
          for (i = 0; i < adjacentCells.length; i++) {
            var $adj = $(adjacentCells[i]);
            if (!$adj.is('.mine') && !$adj.is('.revealed')) {
              if ($adj.is('.zero')) {
                zeroClick($adj);
              }
              cellClick($adj, 'reveal');
            }
          }
        }
      }
    }

    // Check status
    function statusCheck() {
      if ($('.cell.revealed').length === freeCells) {
        stopTimer();
        var winTime = $('#timer').html();
        $grid.addClass('disabled win');
        resetHighScore(level, winTime);
      }
    }

    function lose() {
      $grid.addClass('disabled lose');
      $('.cell.mine').addClass('revealed');
      stopTimer();
    }

    // Clicking on a cell
    $document.on('click', '.cell', function(e) {
      e.preventDefault();
      var action = 'reveal';
      var $cell = $(this);

      if (e.altKey || e.which === 3) {
        action = 'flag';
      } else if ($cell.is('.revealed') && e.which === 1) {
        action = 'clear';
      }

      if ($cell.is('.flagged') && action === 'reveal') {
        return;
      }

      cellClick($cell, action);
    }).on('contextmenu', '.cell', function(e) {
      e.preventDefault(); // Evita o menu de contexto padrão do navegador ao clicar com o botão direito
    });

    // Mouse down on a cell
    $document.on('mousedown', '.cell:not(.revealed,.flagged)', function(e) {
      if (!e.altKey && e.which !== 3) {
        $(this).addClass('mousedown');
      }
    }).on('mouseup mouseleave', '.cell.mousedown', function() {
      $(this).removeClass('mousedown');
    });

    // Scoreboard functionality
    function resetHighScore(lvl, winTime) {
      var currentScore = localStorage.getItem(lvl);
      if (currentScore) {
        if (parseInt(winTime, 10) < parseInt(currentScore, 10)) {
          localStorage.setItem(lvl, winTime);
          populateHighScore(lvl, winTime, true);
        }
      } else {
        localStorage.setItem(lvl, winTime);
        populateHighScore(lvl, winTime, true);
      }
    }

    function populateHighScore(lvl, highScore, highlight) {
      if (!$('#leaderboard').length) {
        $board.find('.bottom').append('<div id="leaderboard"><h4>High Scores</h4><ul><li class="beginner"></li><li class="intermediate"></li><li class="expert"></li></ul><div><button id="score-reset" class="score-reset">Clear Scores</button></div></div>');
      }
      if (highlight === true) {
        $('#leaderboard .highlight').removeClass('highlight');
        $('#leaderboard .' + lvl).addClass('highlight');
      }
      var highScoreDisplay = parseInt(highScore, 10);
      $('#leaderboard .' + lvl).html('<span>' + lvl + '</span>: ' + highScoreDisplay + ' seconds');
    }

    function clearScores() {
      localStorage.clear();
      $('#leaderboard').remove();
    }

    // Clicking on score reset to clear scores
    $document.on('click', '#score-reset', clearScores);

    // Inicializa o tabuleiro padrão
    setBoard(level);
    
    // Mudança de nível via select
    $levelSelect.on('change', function() {
      setBoard($(this).val());
    });
  }

  _init();
});
