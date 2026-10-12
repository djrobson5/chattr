export interface DemoStep {
  choices: string[];        // 3 user response options
  assistantReply: string;   // Scripted AI reply (same regardless of choice)
  translation: string;      // English translation of assistantReply
}

export interface DemoScript {
  scenarioId: string;
  steps: DemoStep[];
}

export const demoScripts: DemoScript[] = [
  {
    scenarioId: "making-plans-english",
    steps: [
      {
        choices: [
          "Maybe we could go to the movies?",
          "How about trying that new restaurant?",
          "We could hang out at the park!",
        ],
        assistantReply: "Oh yeah, that sounds fun! What time works for you?",
        translation: "Oh yeah, that sounds fun! What time works for you?",
      },
      {
        choices: [
          "How about around 2pm?",
          "I'm free after lunch!",
          "Anytime after noon works for me.",
        ],
        assistantReply: "Perfect, let's say 2. Should I invite anyone else?",
        translation: "Perfect, let's say 2. Should I invite anyone else?",
      },
      {
        choices: [
          "Yeah, ask Sarah if she's free!",
          "Nah, just the two of us is fine.",
          "Maybe see if the whole group wants to come?",
        ],
        assistantReply: "Sounds like a plan! I'll text you tomorrow to confirm. Can't wait! 😄",
        translation: "Sounds like a plan! I'll text you tomorrow to confirm. Can't wait! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-italian",
    steps: [
      {
        choices: [
          "Potremmo andare al cinema!",
          "Che ne dici di provare quel ristorante nuovo?",
          "Possiamo fare una passeggiata al parco!",
        ],
        assistantReply: "Bella idea! A che ora ci vediamo?",
        translation: "Great idea! What time shall we meet?",
      },
      {
        choices: [
          "Verso le due del pomeriggio?",
          "Sono libero dopo pranzo!",
          "Per me va bene qualsiasi ora dopo mezzogiorno.",
        ],
        assistantReply: "Perfetto, allora alle due! Invito anche qualcun altro?",
        translation: "Perfect, so at two! Should I invite anyone else?",
      },
      {
        choices: [
          "Sì, chiedi a Marco se è libero!",
          "No, solo noi due va benissimo.",
          "Magari chiedi a tutto il gruppo?",
        ],
        assistantReply: "Ottimo, allora è deciso! Ti scrivo domani per confermare. Non vedo l'ora! 😄",
        translation: "Great, so it's decided! I'll text you tomorrow to confirm. Can't wait! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-spanish",
    steps: [
      {
        choices: [
          "¡Podríamos ir al cine!",
          "¿Qué tal si probamos ese restaurante nuevo?",
          "¡Podemos dar un paseo por el parque!",
        ],
        assistantReply: "¡Buena idea! ¿A qué hora quedamos?",
        translation: "Good idea! What time shall we meet?",
      },
      {
        choices: [
          "¿Sobre las dos de la tarde?",
          "¡Estoy libre después de comer!",
          "Cualquier hora después del mediodía me va bien.",
        ],
        assistantReply: "Perfecto, ¡a las dos entonces! ¿Invito a alguien más?",
        translation: "Perfect, at two then! Should I invite anyone else?",
      },
      {
        choices: [
          "¡Sí, pregunta a María si está libre!",
          "No, solo nosotros dos está bien.",
          "¿Quizás le dices al grupo entero?",
        ],
        assistantReply: "¡Hecho! Te escribo mañana para confirmar. ¡Qué ganas! 😄",
        translation: "Done! I'll text you tomorrow to confirm. Can't wait! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-french",
    steps: [
      {
        choices: [
          "On pourrait aller au cinéma !",
          "Et si on essayait ce nouveau resto ?",
          "On peut se balader au parc !",
        ],
        assistantReply: "Bonne idée ! On se retrouve à quelle heure ?",
        translation: "Good idea! What time shall we meet?",
      },
      {
        choices: [
          "Vers 14h, ça te va ?",
          "Je suis libre après le déjeuner !",
          "N'importe quand après midi ça me va.",
        ],
        assistantReply: "Parfait, disons 14h ! J'invite quelqu'un d'autre ?",
        translation: "Perfect, let's say 2pm! Should I invite anyone else?",
      },
      {
        choices: [
          "Oui, demande à Sophie si elle est libre !",
          "Non, juste nous deux c'est bien.",
          "Tu veux demander à tout le groupe ?",
        ],
        assistantReply: "Super, c'est décidé ! Je t'écris demain pour confirmer. J'ai trop hâte ! 😄",
        translation: "Great, it's decided! I'll text you tomorrow to confirm. I can't wait! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-german",
    steps: [
      {
        choices: [
          "Wir könnten ins Kino gehen!",
          "Wie wäre es mit dem neuen Restaurant?",
          "Wir können im Park spazieren gehen!",
        ],
        assistantReply: "Gute Idee! Um wie viel Uhr treffen wir uns?",
        translation: "Good idea! What time shall we meet?",
      },
      {
        choices: [
          "So gegen 14 Uhr?",
          "Ich bin nach dem Mittagessen frei!",
          "Jede Zeit nach Mittag passt mir.",
        ],
        assistantReply: "Perfekt, dann um 14 Uhr! Soll ich noch jemanden einladen?",
        translation: "Perfect, then at 2pm! Should I invite anyone else?",
      },
      {
        choices: [
          "Ja, frag mal Anna ob sie Zeit hat!",
          "Nein, nur wir zwei ist super.",
          "Vielleicht die ganze Gruppe?",
        ],
        assistantReply: "Super, dann steht der Plan! Ich schreib dir morgen zur Bestätigung. Freu mich! 😄",
        translation: "Great, the plan is set! I'll text you tomorrow to confirm. Looking forward to it! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-chinese",
    steps: [
      {
        choices: [
          "我们可以去看电影！",
          "去试试那家新餐厅怎么样？",
          "我们可以去公园逛逛！",
        ],
        assistantReply: "好主意！你几点方便？",
        translation: "Good idea! What time works for you?",
      },
      {
        choices: [
          "下午两点左右怎么样？",
          "我吃完午饭就有空！",
          "中午以后随时都行。",
        ],
        assistantReply: "行，那就两点！还叫别人一起吗？",
        translation: "Okay, two o'clock then! Should we invite anyone else?",
      },
      {
        choices: [
          "嗯，问问小明有没有空！",
          "不用了，就咱俩就行。",
          "要不问问大家都来？",
        ],
        assistantReply: "好嘞，就这么定了！我明天再跟你确认。期待！😄",
        translation: "Alright, it's settled! I'll confirm with you tomorrow. Looking forward to it! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-japanese",
    steps: [
      {
        choices: [
          "映画見に行かない？",
          "あの新しいレストラン行ってみない？",
          "公園で散歩しない？",
        ],
        assistantReply: "いいね！何時にする？",
        translation: "Sounds good! What time?",
      },
      {
        choices: [
          "2時くらいはどう？",
          "お昼の後なら暇だよ！",
          "午後ならいつでもいいよ。",
        ],
        assistantReply: "了解、じゃ2時で！他に誰か誘う？",
        translation: "Got it, 2 o'clock then! Should we invite anyone else?",
      },
      {
        choices: [
          "うん、ユキも誘ってみて！",
          "ううん、二人でいいよ。",
          "みんなに声かけてみる？",
        ],
        assistantReply: "おっけー、決まり！明日また連絡するね。楽しみ！😄",
        translation: "Okay, it's decided! I'll message you tomorrow. Looking forward to it! 😄",
      },
    ],
  },
  {
    scenarioId: "making-plans-korean",
    steps: [
      {
        choices: [
          "영화 보러 갈까?",
          "그 새로운 식당 가볼까?",
          "공원에서 산책할까?",
        ],
        assistantReply: "좋아! 몇 시에 만날까?",
        translation: "Sounds good! What time should we meet?",
      },
      {
        choices: [
          "오후 2시쯤 어때?",
          "점심 먹고 나서 시간 돼!",
          "낮 이후면 언제든 괜찮아.",
        ],
        assistantReply: "좋아, 그럼 2시에! 다른 사람도 부를까?",
        translation: "Great, 2 o'clock then! Should we invite anyone else?",
      },
      {
        choices: [
          "응, 민지한테도 물어봐!",
          "아니, 우리 둘이면 돼.",
          "다 같이 오라고 할까?",
        ],
        assistantReply: "좋아, 그럼 그렇게 하자! 내일 다시 연락할게. 기대돼! 😄",
        translation: "Okay, let's do that! I'll message you tomorrow. Can't wait! 😄",
      },
    ],
  },
];

export function getDemoScript(scenarioId: string): DemoScript | undefined {
  return demoScripts.find((s) => s.scenarioId === scenarioId);
}

export function getDemoScenarioId(language: string): string {
  return `making-plans-${language}`;
}
