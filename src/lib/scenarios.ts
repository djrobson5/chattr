import { Difficulty, Scenario } from "./types";

const countryMap: Record<string, string> = {
  english: "the United States",
  italian: "Italy",
  spanish: "Spain",
  french: "France",
  german: "Germany",
  chinese: "China",
  japanese: "Japan",
  korean: "South Korea",
};

const langNameMap: Record<string, string> = {
  english: "English",
  italian: "Italian",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Mandarin Chinese",
  japanese: "Japanese",
  korean: "Korean",
};

/** Display name for a language id, e.g. "chinese" → "Mandarin Chinese". */
export function getLanguageName(language: string): string {
  return langNameMap[language] ?? language;
}

function buildSystemPrompt(character: string, context: string, language: string): string {
  const country = countryMap[language] ?? language;
  const langDisplay = langNameMap[language] ?? language;

  return `You are a ${character} in ${country}. You are having a text message conversation with someone who is practicing ${langDisplay}.

Rules:
- Respond ONLY in ${langDisplay}. Never use another language.
- Stay in character as a ${character} ${context}.
- Keep replies short: 1-3 sentences, texting style.
- Use casual/natural texting language appropriate for the situation.
- If the user writes in English, gently continue in the target language as if you understood.
- Never break character or explain that you are an AI.
- You can only send a message right after the user texts you, so never promise to get back to them later (e.g., "let me check and I'll let you know"). If you would look something up or check something, do it now and include the result in this same message — make up plausible details (times, prices, names) as needed.
- Only end the conversation once it has truly wrapped up: the user has explicitly agreed to a specific plan, completed the transaction, or said goodbye. Never end in a message that asks a question, proposes something, or leaves anything for the user to answer. When that point is reached, end your final message with [CONV_END] on a new line. If in doubt, do not end. If the user continues talking after an ending, simply resume naturally without [CONV_END].`;
}

// Common texting abbreviations and slang examples by language
const textingExamples: Record<string, { intermediate: string; advanced: string }> = {
  italian: {
    intermediate: 'e.g., "cmq" (comunque), "nn" (non), "msg" (messaggio), "risp" (rispondi), "tvb" (ti voglio bene), "x" (per), "ke" (che), "xké" (perché)',
    advanced: 'e.g., "cmq", "nn", "tvb", "x", "ke", "xké", "sn" (sono), "qnd" (quando), "dv" (dove), "gg" (giorno), "scs" (scusa), "asp" (aspetta), "vbb" (va bene), plus slang like "bella/bello" (cool), "che figata" (how cool), "boh" (dunno)',
  },
  spanish: {
    intermediate: 'e.g., "tb" (también), "q" (que), "xq" (porque/por qué), "ntp" (no te preocupes), "tq" (te quiero), "msj" (mensaje), "x" (por)',
    advanced: 'e.g., "tb", "q", "xq", "ntp", "tq", "msj",  "ns" (no sé), "tmb" (también), "dnd" (donde), "finde" (fin de semana), "bss" (besos), "desp" (después), plus slang like "mola" (cool), "tío/tía" (dude), "quedamos" (let\'s meet), "flipar" (to freak out)',
  },
  french: {
    intermediate: 'e.g., "slt" (salut), "cv" (ça va), "bcp" (beaucoup), "stp" (s\'il te plaît), "mdr" (mort de rire = lol), "bsr" (bonsoir), "msg" (message)',
    advanced: 'e.g., "slt", "cv", "bcp", "stp", "mdr", "bsr", "jsp" (je ne sais pas), "tkt" (t\'inquiète), "ajd" (aujourd\'hui), "ptdr" (pété de rire), "jtm" (je t\'aime), "bref" (anyway), plus slang like "ouf" (crazy), "kiffer" (to love), "meuf/mec" (girl/guy), "c\'est chanmé" (it\'s amazing)',
  },
  german: {
    intermediate: 'e.g., "vllt" (vielleicht), "bzgl" (bezüglich), "lg" (liebe Grüße), "haha" or "lol", "omg", "gg" (good game), "hdl" (hab dich lieb)',
    advanced: 'e.g., "vllt", "bzgl", "lg", "hdl", "ka" (keine Ahnung), "wg" (wegen), "eig" (eigentlich), "digga/alter" (dude), "geil" (awesome), "krass" (crazy/intense), "Bock haben" (to feel like doing sth), "chillen" (to chill), "abgefahren" (wild)',
  },
  english: {
    intermediate: 'e.g., "lol", "btw" (by the way), "tbh" (to be honest), "imo" (in my opinion), "omg", "nvm" (never mind), "idk" (I don\'t know)',
    advanced: 'e.g., "lol", "btw", "tbh", "imo", "ngl" (not gonna lie), "fr" (for real), "icymi" (in case you missed it), "lowkey", "no cap" (no lie), "bet" (okay/sure), "slay", "dead" (that\'s hilarious)',
  },
  chinese: {
    intermediate: 'e.g., "哈哈" (haha), "嗯嗯" (uh-huh/yes), "好的" (ok), "么么哒" (kisses), "88" (bye, sounds like 拜拜), "666" (awesome/skilled), "亲" (dear)',
    advanced: 'e.g., "哈哈", "666", "88", "yyds" (永远的神 = GOAT), "绝绝子" (absolutely amazing), "xswl" (笑死我了 = dying of laughter), "awsl" (啊我死了 = I\'m dead), "nb" (牛逼 = badass/awesome), "8错" (不错 = not bad), "酱紫" (这样子 = like this), "表" (不要 = don\'t), "盆友" (朋友 = friend)',
  },
  japanese: {
    intermediate: 'e.g., "笑" or "w" (lol), "おk" (ok), "り" (了解 = understood), "まじ" (seriously), "めっちゃ" (very/super), "やば" (yikes/wow), "なる" (なるほど = I see)',
    advanced: 'e.g., "w" or "草" (lol), "り", "おk", "まじ卍" (super serious/crazy), "それな" (so true), "ワンチャン" (one chance = maybe), "エモい" (emotional/nostalgic), "詰んだ" (I\'m done for), "とりま" (とりあえずまあ = for now), "おつ" (お疲れ = good work), "かまちょ" (attention-seeking), "てか" (というか = or rather)',
  },
  korean: {
    intermediate: 'e.g., "ㅋㅋㅋ" (hahaha), "ㅎㅎ" (hehe), "ㄱㄱ" (고고 = go go), "ㅇㅇ" (응 = yes), "ㄴㄴ" (노노 = no no), "ㅇㅋ" (오케이 = okay), "ㄷㄷ" (덜덜 = shaking/wow)',
    advanced: 'e.g., "ㅋㅋㅋ", "ㄱㄱ", "ㅇㅇ", "ㅂㅂ" (바이바이 = bye bye), "ㅈㅅ" (죄송 = sorry), "ㄹㅇ" (리얼 = for real), "ㅇㄱㄹㅇ" (이거레알 = this is real), "갑분싸" (갑자기 분위기 싸해짐 = suddenly awkward), "TMI" (too much info), "JMT" (존맛탱 = so delicious), "혼코노" (혼자 코인 노래방 = solo karaoke)',
  },
};

function getDifficultyInstruction(difficulty: Difficulty, language: string): string {
  if (difficulty === "beginner") {
    return "Use only simple, common vocabulary and basic grammar (present tense, simple sentences). Avoid idioms, slang, abbreviations, or complex structures. Keep sentences very short. Write out all words fully.";
  }

  const examples = textingExamples[language];

  if (difficulty === "intermediate") {
    let instruction = "Use everyday vocabulary and natural phrasing. You may use common past/future tenses and standard expressions. Text like a real person would — use occasional texting abbreviations and casual shorthand naturally mixed in with regular words.";
    if (examples) {
      instruction += ` Common abbreviations in this language: ${examples.intermediate}. Don't overuse them — sprinkle them in where a native texter naturally would.`;
    }
    return instruction;
  }

  // advanced
  let instruction = "Use rich vocabulary, idiomatic expressions, subjunctive mood, and complex grammar. Text authentically like a native speaker — freely use texting abbreviations, slang, colloquialisms, and informal shortcuts. Drop letters, shorten words, and use internet-speak the way a real native would in casual messages.";
  if (examples) {
    instruction += ` Common texting language: ${examples.advanced}. Use these naturally and frequently — this should feel like a real text conversation between natives.`;
  }
  return instruction;
}

export function getSystemPromptWithDifficulty(
  scenario: Scenario,
  difficulty: Difficulty
): string {
  return `${scenario.systemPrompt}\n\nLanguage level: ${getDifficultyInstruction(difficulty, scenario.language)}`;
}

// --- Scenario definitions per language ---

interface ScenarioTemplate {
  id: string;
  title: string;
  titles: Record<string, string>;
  category: "everyday" | "travel";
  character: string;
  characters: Record<string, string>;
  emoji: string;
  context: string;
  starters: Record<string, string>;
}

const templates: ScenarioTemplate[] = [
  {
    id: "making-plans",
    title: "Making Plans with a Friend",
    titles: {
      italian: "Fare Piani con un Amico",
      spanish: "Haciendo Planes con un Amigo",
      french: "Faire des Plans avec un Ami",
      german: "Pläne Machen mit einem Freund",
      chinese: "和朋友制定计划",
      japanese: "友達と予定を立てる",
      korean: "친구와 약속 잡기",
    },
    category: "everyday",
    character: "Friend",
    characters: {
      italian: "Amico",
      spanish: "Amigo",
      french: "Ami",
      german: "Freund",
      chinese: "朋友",
      japanese: "友達",
      korean: "친구",
    },
    emoji: "\u{1F4C5}",
    context: "making weekend plans. Be casual and friendly, use informal form",
    starters: {
      english: "Hey! What are we doing this weekend?",
      italian: "Ciao! Che facciamo questo fine settimana?",
      spanish: "\u00a1Hola! \u00bfQu\u00e9 hacemos este fin de semana?",
      french: "Salut ! Qu'est-ce qu'on fait ce week-end ?",
      german: "Hey! Was machen wir dieses Wochenende?",
      chinese: "嘿！这个周末我们干嘛？",
      japanese: "ねえ！今週末なにする？",
      korean: "야! 이번 주말에 뭐 할까?",
    },
  },
  {
    id: "texting-roommate",
    title: "Texting a Roommate",
    titles: {
      italian: "Messaggiare con il Coinquilino",
      spanish: "Mensajeando al Compañero de Piso",
      french: "Écrire à son Colocataire",
      german: "Dem Mitbewohner Schreiben",
      chinese: "给室友发消息",
      japanese: "ルームメイトにメッセージ",
      korean: "룸메이트에게 문자하기",
    },
    category: "everyday",
    character: "Roommate",
    characters: {
      italian: "Coinquilino",
      spanish: "Compañero",
      french: "Colocataire",
      german: "Mitbewohner",
      chinese: "室友",
      japanese: "ルームメイト",
      korean: "룸메이트",
    },
    emoji: "\u{1F3E0}",
    context: "sharing an apartment. You need to coordinate groceries, chores, or apartment matters. Be casual and friendly, use informal form",
    starters: {
      english: "Hey, are you home tonight? We need to talk about groceries.",
      italian: "Ehi, sei a casa stasera? Dobbiamo parlare della spesa.",
      spanish: "Oye, \u00bfest\u00e1s en casa esta noche? Tenemos que hablar de la compra.",
      french: "H\u00e9, t'es \u00e0 la maison ce soir ? Faut qu'on parle des courses.",
      german: "Hey, bist du heute Abend zu Hause? Wir m\u00fcssen \u00fcber den Einkauf reden.",
      chinese: "嘿，你今晚在家吗？我们得聊聊买菜的事。",
      japanese: "ねえ、今夜家にいる？食料品の買い出しの話しなきゃ。",
      korean: "야, 오늘 밤에 집에 있어? 장보기 얘기 좀 해야 돼.",
    },
  },
  {
    id: "catching-up",
    title: "Catching Up with an Old Friend",
    titles: {
      italian: "Ritrovarsi con un Vecchio Amico",
      spanish: "Ponerse al Día con un Viejo Amigo",
      french: "Retrouver un Vieil Ami",
      german: "Einen Alten Freund Wiedertreffen",
      chinese: "和老朋友叙旧",
      japanese: "久しぶりの友達と近況報告",
      korean: "오랜 친구와 근황 나누기",
    },
    category: "everyday",
    character: "Old Friend",
    characters: {
      italian: "Vecchio Amico",
      spanish: "Viejo Amigo",
      french: "Vieil Ami",
      german: "Alter Freund",
      chinese: "老朋友",
      japanese: "旧友",
      korean: "오랜 친구",
    },
    emoji: "\u{1F4AC}",
    context: "who hasn't been in touch for a while. You're excited to reconnect and catch up on life updates. Be warm and curious, use informal form",
    starters: {
      english: "Oh hey! It's been forever since we talked! How are you?",
      italian: "Ma ciao! \u00c8 da tantissimo che non ci sentiamo! Come stai?",
      spanish: "\u00a1Hola! \u00a1Cu\u00e1nto tiempo sin hablar! \u00bfC\u00f3mo est\u00e1s?",
      french: "Oh salut ! \u00c7a fait super longtemps ! Comment tu vas ?",
      german: "Hey! Ewig nicht geh\u00f6rt! Wie geht's dir?",
      chinese: "哎呀！好久没联系了！你最近怎么样？",
      japanese: "おー久しぶり！元気にしてた？",
      korean: "어머! 진짜 오랜만이다! 잘 지냈어?",
    },
  },
  {
    id: "nonnas-recipe",
    title: "Asking Grandma for a Recipe",
    titles: {
      italian: "Chiedere una Ricetta alla Nonna",
      spanish: "Pedirle una Receta a la Abuela",
      french: "Demander une Recette à Mamie",
      german: "Oma nach einem Rezept Fragen",
      chinese: "向奶奶请教菜谱",
      japanese: "おばあちゃんにレシピを聞く",
      korean: "할머니께 레시피 여쭤보기",
    },
    category: "everyday",
    character: "Grandmother",
    characters: {
      italian: "Nonna",
      spanish: "Abuela",
      french: "Mamie",
      german: "Oma",
      chinese: "奶奶",
      japanese: "おばあちゃん",
      korean: "할머니",
    },
    emoji: "\u{1F475}",
    context: "who loves cooking and is happy to share recipes. You give instructions in a warm, slightly rambling way with occasional old-fashioned expressions. Use informal form",
    starters: {
      english: "Sweetie! So nice to hear from you. What's new?",
      italian: "Tesoro! Che bello sentirti. Cosa mi racconti?",
      spanish: "\u00a1Tesoro! Qu\u00e9 alegr\u00eda o\u00edrte. \u00bfQu\u00e9 me cuentas?",
      french: "Mon tr\u00e9sor ! Comme c'est bon d'avoir de tes nouvelles. Raconte-moi !",
      german: "Schatz! Wie sch\u00f6n von dir zu h\u00f6ren. Was gibt's Neues?",
      chinese: "宝贝！听到你的消息真高兴。最近怎么样啊？",
      japanese: "あら！連絡くれて嬉しいわ。最近どうしてるの？",
      korean: "아이고! 연락해줘서 반갑다. 요즘 어떻게 지내?",
    },
  },
  {
    id: "group-event",
    title: "Planning a Group Event",
    titles: {
      italian: "Organizzare un Evento di Gruppo",
      spanish: "Planificando un Evento Grupal",
      french: "Organiser un Événement de Groupe",
      german: "Ein Gruppenevent Planen",
      chinese: "策划一次聚会",
      japanese: "グループイベントの計画",
      korean: "단체 모임 계획하기",
    },
    category: "everyday",
    character: "Friend",
    characters: {
      italian: "Amico",
      spanish: "Amigo",
      french: "Ami",
      german: "Freund",
      chinese: "朋友",
      japanese: "友達",
      korean: "친구",
    },
    emoji: "\u{1F389}",
    context: "organizing a party or group outing together. You're enthusiastic and collaborative, discussing details like food, location, and who to invite. Use informal form",
    starters: {
      english: "So, about the party on Saturday... got any ideas?",
      italian: "Allora, per la festa di sabato... hai qualche idea?",
      spanish: "Bueno, para la fiesta del s\u00e1bado... \u00bftienes alguna idea?",
      french: "Alors, pour la f\u00eate de samedi... t'as des id\u00e9es ?",
      german: "Also, f\u00fcr die Party am Samstag... hast du eine Idee?",
      chinese: "那个，周六的聚会...你有什么想法吗？",
      japanese: "ねえ、土曜のパーティーなんだけど...なんかアイデアある？",
      korean: "그래, 토요일 파티 말인데... 뭔가 아이디어 있어?",
    },
  },
  {
    id: "meetup-new-city",
    title: "Coordinating a Meetup",
    titles: {
      italian: "Coordinare un Incontro",
      spanish: "Coordinando un Encuentro",
      french: "Coordonner un Rendez-vous",
      german: "Ein Treffen Koordinieren",
      chinese: "协调见面",
      japanese: "待ち合わせの調整",
      korean: "만남 장소 정하기",
    },
    category: "travel",
    character: "Friend",
    characters: {
      italian: "Amico",
      spanish: "Amigo",
      french: "Ami",
      german: "Freund",
      chinese: "朋友",
      japanese: "友達",
      korean: "친구",
    },
    emoji: "\u{1F4CD}",
    context: "who lives in the city the user is visiting. You're helping them find their way to a meeting point. Give practical directions and suggestions. Use informal form",
    starters: {
      english: "Did you arrive? Where are you now?",
      italian: "Sei arrivato/a? Dove sei adesso?",
      spanish: "\u00bfYa llegaste? \u00bfD\u00f3nde est\u00e1s ahora?",
      french: "T'es arriv\u00e9(e) ? T'es o\u00f9 l\u00e0 ?",
      german: "Bist du schon da? Wo bist du gerade?",
      chinese: "你到了吗？现在在哪儿？",
      japanese: "着いた？今どこにいるの？",
      korean: "도착했어? 지금 어디야?",
    },
  },
  {
    id: "airbnb-host",
    title: "Messaging a Rental Host",
    titles: {
      italian: "Scrivere all'Host dell'Alloggio",
      spanish: "Escribir al Anfitrión del Alojamiento",
      french: "Écrire à l'Hôte du Logement",
      german: "Dem Gastgeber der Unterkunft Schreiben",
      chinese: "给房东发消息",
      japanese: "宿泊先のホストにメッセージ",
      korean: "숙소 호스트에게 메시지 보내기",
    },
    category: "travel",
    character: "Host",
    characters: {
      italian: "Padrone di Casa",
      spanish: "Anfitrión",
      french: "Hôte",
      german: "Gastgeber",
      chinese: "房东",
      japanese: "ホスト",
      korean: "호스트",
    },
    emoji: "\u{1F511}",
    context: "managing a vacation rental. Be friendly but professional, help with check-in details, keys, house rules, and local tips. Use formal form",
    starters: {
      english: "Good morning! Welcome! What time do you think you'll arrive?",
      italian: "Buongiorno! Benvenuto/a! A che ora pensa di arrivare?",
      spanish: "\u00a1Buenos d\u00edas! \u00a1Bienvenido/a! \u00bfA qu\u00e9 hora piensa llegar?",
      french: "Bonjour ! Bienvenu(e) ! \u00c0 quelle heure pensez-vous arriver ?",
      german: "Guten Tag! Willkommen! Wann denken Sie anzukommen?",
      chinese: "您好！欢迎！您大概几点到呢？",
      japanese: "こんにちは！ようこそ！何時頃ご到着の予定ですか？",
      korean: "안녕하세요! 환영합니다! 몇 시쯤 도착하실 예정인가요?",
    },
  },
  {
    id: "local-recommendations",
    title: "Asking a Friend for Recommendations",
    titles: {
      italian: "Chiedere Consigli a un Amico",
      spanish: "Pedir Recomendaciones a un Amigo",
      french: "Demander des Recommandations à un Ami",
      german: "Einen Freund um Empfehlungen Bitten",
      chinese: "向朋友要推荐",
      japanese: "友達におすすめを聞く",
      korean: "친구에게 추천 받기",
    },
    category: "travel",
    character: "Local Friend",
    characters: {
      italian: "Amico del Posto",
      spanish: "Amigo Local",
      french: "Ami Local",
      german: "Einheimischer Freund",
      chinese: "当地朋友",
      japanese: "地元の友達",
      korean: "현지 친구",
    },
    emoji: "\u{1F5FA}\u{FE0F}",
    context: "who lives in the city the user is visiting. You're excited to help them plan their trip with restaurant, sightseeing, and activity recommendations. Use informal form",
    starters: {
      english: "You're finally coming to visit! How many days are you staying?",
      italian: "Finalmente vieni a trovarmi! Quanti giorni stai?",
      spanish: "\u00a1Por fin vienes a visitarme! \u00bfCu\u00e1ntos d\u00edas te quedas?",
      french: "Tu viens enfin me voir ! Tu restes combien de jours ?",
      german: "Endlich kommst du mich besuchen! Wie viele Tage bleibst du?",
      chinese: "你终于要来啦！打算待几天？",
      japanese: "やっと来てくれるんだ！何日間いるの？",
      korean: "드디어 놀러 오는 거야! 며칠 있을 거야?",
    },
  },
];

function generateScenarios(): Scenario[] {
  const result: Scenario[] = [];
  const supportedLanguages = ["english", "italian", "spanish", "french", "german", "chinese", "japanese", "korean"];

  for (const lang of supportedLanguages) {
    for (const t of templates) {
      result.push({
        id: `${t.id}-${lang}`,
        title: t.title,
        localizedTitle: t.titles[lang] ?? t.title,
        category: t.category,
        character: t.character,
        localizedCharacter: t.characters[lang] ?? t.character,
        emoji: t.emoji,
        starterMessage: t.starters[lang] ?? t.starters.italian,
        systemPrompt: buildSystemPrompt(t.character, t.context, lang),
        language: lang,
      });
    }
  }

  return result;
}

export const scenarios: Scenario[] = generateScenarios();

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
