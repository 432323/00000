// ===========================
// Interaction Bridge Template
// ===========================

// This file helps connect your game/application with the Web3 Modal.
// There are two main parts:
// 1. The Modal sends signals (events) to your game.
// 2. Your game sends signals (events) to the Modal.

// ===========================
// Available Events in the Modal
// ===========================

// The Modal can trigger the following events:
// 1. 'transactionSuccess' - Fired when a transaction is successful.
// 2. 'walletConnected' - Fired when the wallet is connected.
// 3. 'walletDisconnected' - Fired when the wallet is disconnected.
// 4. 'leaderboardFetched' - Fired when the leaderboard is fetched.
// 5. 'transactionHashReceived' - Fired when a transaction hash is received.
// 6. 'pendingTransaction' - Fired when a transaction is pending.

// ===========================
// 1. How to Respond to Modal Events in Your Game
// ===========================

// Example: Show the play button when a transaction is successful.
function showPlayButton() {
    if (typeof _oButPlay !== 'undefined') {
        _oButPlay.setVisible(true);
        console.log('Interaction Bridge: Play button shown');
    }
}
// Add the listener for 'transactionSuccess' to call your game function.
window.addEventListener('transactionSuccess', showPlayButton);

// Example: Pause the game when a transaction is pending.
function pauseGame() {
    if (typeof s_oGame !== 'undefined' && typeof s_oGame.pauseGame === 'function') {
        s_oGame.pauseGame();
        console.log('Interaction Bridge: Game paused due to pending transaction');
    }
}
// Add the listener for 'pendingTransaction' to call your game function.
window.addEventListener('pendingTransaction', pauseGame);

// You can do the same for other events like 'walletConnected', 'leaderboardFetched', etc.

// ===========================
// 2. How to Send Events from Your Game to the Modal
// ===========================

// Your game can also trigger actions in the Modal, such as submitting scores or initiating transactions.

// Example: Automatically submit the score when your game finishes.
if (typeof s_oMain !== 'undefined') {
    $(s_oMain).on("save_score", function(evt, iScore) {
        console.log('Interaction Bridge: save_score event detected with score:', iScore);
        // Use the submitScore function from modal.js to send the score.
        submitScore(account, iScore);
    });
} else {
    console.error('Interaction Bridge: s_oMain is not defined, cannot listen for save_score event.');
}

// Example: Triggering a replay transaction when the game requests a replay.
function requestReplay() {
    console.log('Interaction Bridge: Replay requested');
    window.dispatchEvent(new Event('replayRequested'));
}

// To send other signals from your game to the Modal, simply dispatch the relevant event using:
// window.dispatchEvent(new Event('yourEventName'));

// ===========================
// Final Tips
// ===========================

// 1. If you want the Modal to control your game, place your game logic in the "Respond to Modal Events" section.
// 2. If you want your game to control the Modal, use the "Send Events from Your Game" section.
// 3. Make sure to match the event names exactly when adding listeners or dispatching events.