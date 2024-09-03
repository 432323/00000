// ===========================
// Interaction Bridge
// ===========================
// This file serves as the communication layer between your web3 modal (handled in modal.js)
// and your game/application. It facilitates dynamic interactions such as updating the UI
// based on transaction success, changing the state of a dynamic hot button (DHB), and responding to custom events.

let isScoreSubmitted = false; // Flag to track if a score was just submitted

// ===========================
// 1. Initial Setup
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Interaction Bridge: DOMContentLoaded event fired');
    if (typeof _oButPlay !== 'undefined') {
        _oButPlay.setVisible(false);
        console.log('Interaction Bridge: Play button hidden');
    }
});

// ===========================
// 2. Transaction Handling
// ===========================

window.addEventListener('transactionSuccess', () => {
    console.log('Interaction Bridge: Transaction success event received');

    const isReplayTransaction = isScoreSubmitted && checkIfOnHomeScreen(); // Example condition to determine replay

    if (isReplayTransaction) {
        window.dispatchEvent(new Event('replayTransactionSuccess'));
        console.log('Interaction Bridge: Replay transaction event dispatched');
    } else {
        if (typeof s_oMenu !== 'undefined' && typeof s_oMenu._onButPlayRelease === 'function') {
            s_oMenu._onButPlayRelease(); // Trigger the play button function directly
            console.log('Interaction Bridge: Play button triggered programmatically');
        }
    }

    // Reset the flag after handling the transaction
    isScoreSubmitted = false;

    toggleAppRunning(true); // No need for manual delay; handled in modal.js
});

// ===========================
// 3. Dynamic Hot Button (DHB) Management
// ===========================

function setHotButton(label, actionFunction) {
    const button = document.getElementById('initiateTransactionButton');
    const buttonText = document.getElementById('initiateTransactionText');

    // Update the button label
    buttonText.innerText = label;

    // Apply the hot-button CSS class if it's a hot button (e.g., Replay Game)
    if (label === 'Replay Game') {
        button.classList.add('hot-button-style');
        button.classList.remove('clicked'); // Remove clicked style if it's there
    } else {
        button.classList.remove('hot-button-style');
        button.classList.remove('clicked');
    }

    // Remove previous event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add new event listener for the click action
    newButton.addEventListener('click', () => {
        newButton.classList.add('clicked'); // Add the clicked class when clicked
        newButton.classList.remove('hot-button-style'); // Remove the hot button style on click
        actionFunction(); // Trigger the assigned action
    });
}

function resetHotButton() {
    const button = document.getElementById('initiateTransactionButton');
    button.classList.remove('hot-button-style'); // Remove the hot button class
    button.classList.remove('clicked'); // Remove the clicked class
    resetDHBToDefault(); // Reset button to its default state
}

// ===========================
// 4. Event Listeners for Hot Buttons
// ===========================

window.addEventListener('autoSubmitScore', () => {
    console.log('Interaction Bridge: autoSubmitScore event detected with score:', window.currentGameScore);
    toggleAppRunning(false);

    if (typeof submitScore === 'function') {
        submitScore(account, window.currentGameScore).then(() => {
            isScoreSubmitted = true; // Set flag when score is submitted
            console.log('Interaction Bridge: Score submitted, replay transaction likely next.');
        });
    } else {
        console.error('Interaction Bridge: submitScore function is not defined in modal.js.');
    }

    setHotButton('Replay Game', handleReplayTransaction);
});

window.addEventListener('confirmed', () => {
    console.log('Interaction Bridge: confirmed event received.');
    toggleAppRunning(true); // No need for manual delay; handled in modal.js
});

window.addEventListener('replayRequested', handleReplayTransaction);

// ===========================
// 5. Replay Game Handling
// ===========================

function handleReplayTransaction() {
    initiateTransaction(); // Directly call the function from modal.js
}

// ===========================
// Utility Functions
// ===========================

function checkIfOnHomeScreen() {
    // Implement your logic to determine if the game is on the home screen or in a state ready for a new game
    // Return true if on home screen or a new game is about to start
    return true; // Placeholder, replace with actual condition
}
