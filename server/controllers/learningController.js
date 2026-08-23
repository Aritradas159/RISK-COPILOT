const lessons = [
  { id: 'sip', title: { en: 'What is an SIP?', ta: 'SIP என்றால் என்ன?' }, body: { en: 'An SIP invests a fixed amount at regular intervals. It can help build investing discipline over time.', ta: 'SIP என்பது குறிப்பிட்ட தொகையை இடைவெளிகளுடன் முதலீடு செய்வது. இது நீண்ட கால முதலீட்டு ஒழுக்கத்தை உருவாக்க உதவும்.' } },
  { id: 'index', title: { en: 'What is an index fund?', ta: 'Index Fund என்றால் என்ன?' }, body: { en: 'An index fund aims to track a market index rather than selecting individual stocks.', ta: 'Index Fund ஒரு சந்தை குறியீட்டை பின்தொடர முயற்சிக்கிறது; தனிப்பட்ட பங்குகளைத் தேர்வு செய்வது இதன் நோக்கம் அல்ல.' } },
  { id: 'fo', title: { en: 'Why is F&O risky?', ta: 'F&O ஏன் ஆபத்தானது?' }, body: { en: 'Leverage can magnify both gains and losses. A small market move can have a much larger effect on your capital.', ta: 'Leverage லாபத்தையும் இழப்பையும் பெரிதாக்கலாம். சந்தையில் சிறிய மாற்றமும் உங்கள் மூலதனத்தில் பெரிய தாக்கத்தை ஏற்படுத்தலாம்.' } },
  { id: 'drawdown', title: { en: 'What is drawdown?', ta: 'Drawdown என்றால் என்ன?' }, body: { en: 'Drawdown measures how far an investment falls from a previous peak. It helps make downside risk visible.', ta: 'Drawdown என்பது முந்தைய உச்ச நிலையிலிருந்து முதலீடு எவ்வளவு குறைகிறது என்பதை காட்டுகிறது.' } },
  { id: 'diversification', title: { en: 'Why diversify?', ta: 'Diversification ஏன்?' }, body: { en: 'Diversification spreads exposure across assets or strategies so one outcome does not determine the entire portfolio.', ta: 'Diversification பல சொத்துகள் அல்லது உத்திகளில் ஆபத்தைப் பகிர்ந்து கொள்ள உதவுகிறது.' } }
];

export function getLessons(req, res) { res.json({ lessons }); }
