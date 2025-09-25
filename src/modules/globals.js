const privateButtonRepliesTable = [
    "why dont you go press your own command buttons",
    "no",
    "nope",
    "not gonna happen",
    "stop",
    "denied",
    "its not gonna happen so stop",
    "yo bro",
    "bro",
    "yo",
    "nuh",
    "nuh uh",
    "STOP",
]

const emojiTable = {
    // well, back to h bot basics
    weenachievement: '1420139236442509482',
    weenie: '1420702309595222087',
};

function privateButtonReplies() {
    return privateButtonRepliesTable[Math.floor(Math.random() * privateButtonRepliesTable.length)];
}

module.exports = { privateButtonReplies, emojiTable };