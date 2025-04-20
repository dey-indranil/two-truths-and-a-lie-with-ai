module.exports = {
    playerTurnPrompt: (statements) => `Here are three statements from a player: 
        1. ${statements[0]}
        2. ${statements[1]}
        3. ${statements[2]}

        Which one is the lie? 
        I am going to parse your reply. 
        Your reply should strictly be 
        in the format {ai-reply:<one of the 3 sentences you think is a lie>, 
        reason:<2 or 3 sentences on why you think this is a lie"> }`,

    aiTurnPrompt: (topic) => `Give me exactly 2 truths and exactly 1 lie about ${randomTopic}. 
  Label the lie as [LIE]. 
  Make sure each lie and each truth is on a new line. 
  Make sure the statement which is a lie is not always the first or last. 
  Dont give any explanation or additional text. Your reply should contain exactly 3 statement 
  one of which is a lie. When you have picked the 3 sentences to return, shuffle them 
  so that the lie appears on a different line each time.`
  };
  