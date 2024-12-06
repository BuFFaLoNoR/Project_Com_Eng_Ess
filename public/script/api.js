// Function to check if the username is already taken
export function checkUsernameAvailability(username) {
  return fetch('http://44.195.238.84:3222/api/check-username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  })
    .then(response => response.json())
    .then(data => {
      return !data.exists; // Return true if username is available, false if taken
    })
    .catch(error => {
      console.error('Error checking username:', error);
      throw error; // Re-throw error for the calling code to handle
    });
}

// Function to register a new user
export function registerUser(username, password) {
  return fetch('http://44.195.238.84:3222/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error); // Handle the error from backend
      }
      return data; // Return the response if registration was successful
    })
    .catch(error => {
      console.error('Error registering user:', error);
      throw error; // Re-throw error so frontend can handle it
    });
}

// Function to login a user
export function loginUser(username, password) {
  return fetch('http://44.195.238.84:3222/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Login successful') {
        // No token is needed, just save the username in localStorage
        localStorage.setItem('username', username);
        return data; // Return success message
      } else {
        throw new Error('Login failed');
      }
    })
    .catch((error) => {
      console.error('Error logging in:', error);
      throw error; // Throw error so it can be caught in the HTML script
    });
}

// Function to send the score and playerName to the backend
export function sendScoreToBackend(score) {
  const username = localStorage.getItem('username');

  if (!username) {
    console.error('No username found. Please login first.');
    return;
  }

  // Send the score along with playerName
  fetch('http://44.195.238.84:3222/api/highscores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ score: score, playerName: username }), // Send score and playerName
  })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
    })
    .catch((error) => {
      console.error('Error saving score:', error);
    });
}
