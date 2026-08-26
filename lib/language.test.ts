import { describe, it, expect } from 'vitest';
import { scriptLanguage, writtenIn, wantsTour, isSpoken } from './language';

describe('the script settles the language, not the model', () => {
  const cases: [string, string][] = [
    ['ನನ್ನ ಹಣ ಯಾವಾಗ ಬರುತ್ತೆ?', 'kn-IN'],
    ['मेरा दावा क्यों अटका है?', 'hi-IN'],
    ['என் பணம் எப்போது வரும்?', 'ta-IN'],
    ['আমার টাকা কবে আসবে?', 'bn-IN'],
    ['મારા પૈસા ક્યારે આવશે?', 'gu-IN'],
    ['నా డబ్బు ఎప్పుడు వస్తుంది?', 'te-IN'],
    ['എന്റെ പണം എപ്പോൾ വരും?', 'ml-IN'],
    ['ਮੇਰਾ ਪੈਸਾ ਕਦੋਂ ਆਵੇਗਾ?', 'pa-IN'],
  ];

  for (const [q, lang] of cases) {
    it(`reads ${lang} from its own script`, () => {
      expect(scriptLanguage(q)).toBe(lang);
      expect(isSpoken(lang)).toBe(true);
    });
  }

  it('says nothing about Latin text, where the script is no evidence', () => {
    // romanised Hindi looks exactly like English to a script check
    expect(scriptLanguage('mera paisa kab aayega')).toBeNull();
    expect(scriptLanguage('when will my money arrive')).toBeNull();
  });
});

describe('a reply has to come back in the script we asked for', () => {
  it('catches an English answer to a Kannada question', () => {
    expect(writtenIn('Your money will arrive in 15 working days.', 'kn-IN')).toBe(false);
  });

  it('accepts a Kannada answer, digits and English gate names included', () => {
    expect(writtenIn('ನಿಮ್ಮ ಹಣ 15 ಕಾರ್ಯದಿನಗಳಲ್ಲಿ ಬರುತ್ತದೆ. UAN activated.', 'kn-IN')).toBe(true);
  });

  it('does not mistake one Indian script for another', () => {
    expect(writtenIn('ನಿಮ್ಮ ಹಣ ಬರುತ್ತದೆ', 'hi-IN')).toBe(false);
    expect(writtenIn('आपका पैसा आएगा', 'kn-IN')).toBe(false);
  });

  it('has nothing to check for English', () => {
    expect(writtenIn('Your money will arrive in 15 working days.', 'en-IN')).toBe(true);
  });
});

describe('asking to be shown around, however it is typed', () => {
  const yes = [
    'walk me through',
    'walkmethroughplease', // typed one-handed on a phone, no spaces
    'Walk me through!!',
    'What the hell is happening?', // words wedged into the middle
    'what is going on',
    'show me around',
    'I am lost',
    'मुझे प्लीज़ समझाओ क्या हो रहा है',
    'मुझे पूरी वेबसाइट दिखाओ',
    'sab kuch dikhao',
  ];
  for (const q of yes) it(`treats "${q}" as a request for the tour`, () => expect(wantsTour(q)).toBe(true));

  const no = [
    'why is my claim stuck?',
    'what should I do first?',
    'what documents do I need?',
    'मेरा दावा क्यों अटका है?',
    'मेरा बैलेंस दिखाओ', // "show my balance" is a question, not a tour
    'मेरा दावा समझाओ', // so is "explain my claim"
    'when will my money arrive',
  ];
  for (const q of no) it(`leaves "${q}" as an ordinary question`, () => expect(wantsTour(q)).toBe(false));
});
