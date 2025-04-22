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

        aiTurnPrompt: (topic) => `You are playing a game where you must generate exactly 3 statements about ${topic}.
        - Two must be TRUE.
        - One must be a LIE.
        - Label the lie with [LIE] at the end of the sentence.

        Your response must follow **this exact format**:
        1. <statement>
        2. <statement>
        3. <statement>
        
        Please shuffle the order of the statements randomly, along with the label so the lie does not always appear last.
        Make sure the lie is **plausible**, but clearly false, and does not confuse with any of the true facts.
        Only return the 3 statements in this format. Do NOT include any explanations, greetings, or additional text.`        
}