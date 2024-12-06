// Fetch top 10 highscores from the backend and populate the table
fetch('http://44.195.238.84:3222/api/highscores')
  .then(response => response.json())
  .then(data => {
    // Group by playerName and get the highest score for each player
    const highestScores = data.reduce((acc, highscore) => {
      if (!acc[highscore.playerName] || acc[highscore.playerName] < highscore.score) {
        acc[highscore.playerName] = highscore.score; // Keep only the highest score for each player
      }
      return acc;
    }, {});

    // Convert the object back to an array and sort by score (highest to lowest)
    const sortedHighscores = Object.keys(highestScores)
      .map(playerName => ({
        playerName,
        score: highestScores[playerName]
      }))
      .sort((a, b) => b.score - a.score); // Sort by score in descending order

    // Take the top 10 high scores
    const top10Scores = sortedHighscores.slice(0, 10);

    // Populate the table with the top 10 high scores
    const tableBody = document.querySelector('#highscores-table tbody');
    top10Scores.forEach((highscore, index) => {
      const row = document.createElement('tr');
      
      // Rank column
      const rankCell = document.createElement('td');
      rankCell.textContent = index + 1;
      row.appendChild(rankCell);

      // Player name column
      const nameCell = document.createElement('td');
      nameCell.textContent = highscore.playerName;
      row.appendChild(nameCell);

      // Score column
      const scoreCell = document.createElement('td');
      scoreCell.textContent = highscore.score;
      row.appendChild(scoreCell);

      // Add row to the table body
      tableBody.appendChild(row);
    });
  })
  .catch(error => {
    console.error('Error fetching highscores:', error);
  });
