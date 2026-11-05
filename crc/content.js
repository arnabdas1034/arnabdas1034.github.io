// Everything the game shows. Edit text here; do not change the "id" values once people have played.
(() => {
  // ---------- tiny chart drawer for "pick the graph" questions ----------
  const W = 200, H = 120, L = 22, R = 192, T = 10, B = 100;
  const px = (x) => L + x * (R - L), py = (y) => B - y * (B - T);
  const path = (pts) => pts.map((p, i) => (i ? "L" : "M") + px(p[0]).toFixed(1) + " " + py(p[1]).toFixed(1)).join(" ");
  const fn = (f, n = 80) => Array.from({ length: n + 1 }, (_, i) => [i / n, f(i / n)]);
  function chart(lines, dots, ylab, xlab) {
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">`;
    s += `<path d="M${L} ${T - 4} V${B} H${R + 4}" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.4"/>`;
    s += `<text x="4" y="${(T + B) / 2}" fill="currentColor" fill-opacity=".7" font-size="12" transform="rotate(-90 9 ${(T + B) / 2})" text-anchor="middle">${ylab}</text>`;
    s += `<text x="${(L + R) / 2}" y="${H - 4}" fill="currentColor" fill-opacity=".7" font-size="11" text-anchor="middle">${xlab}</text>`;
    lines.forEach((pts) => { s += `<path class="ln" d="${path(pts)}" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`; });
    (dots || []).forEach(([x, y]) => {
      s += `<path class="dt" d="M${px(x)} ${py(y + 0.1)} V${py(y - 0.1)}" stroke-width="1.6"/>`;
      s += `<circle class="dt" cx="${px(x)}" cy="${py(y)}" r="4.6"/>`;
    });
    return s + `</svg>`;
  }
  const swing = (x) => 0.5 + 0.36 * Math.sin(x * Math.PI * 2 * 4.2 - 0.6);
  const co2 = (lines) => chart(lines, null, "CO₂", "time →");
  const proxyDots = [0.06, 0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9].map((x) => [x, swing(x)]);
  const mvp = (lines) => chart(lines, proxyDots, "CO₂", "time →");

  window.KK = {
    title: "Rainforest Collapse",
    sub: "ASL 375 · Carboniferous Live",
    joinUrl: "arnabdas1034.github.io/crc",
    host: "Arnab",
    room: "crc",
    // A wrong answer costs this many points in "Check" rounds. "No idea" and no answer cost nothing.
    penalty: 5,
    // Carboniferous life
    teams: ["Lycopsids", "Tree Ferns", "Amniotes", "Meganeura", "Cordaites", "Coal Swamp"],

    acts: [
      // ---- before Slide 2 ----
      {
        id: "w", type: "q", scored: true, pen: 0, dur: 12, pts: 10,
        kicker: "Predict · before we teach", title: "Gut feeling",
        rule: "Two guesses before the story starts. +10 if right. Wrong costs nothing.",
        qs: [
          { id: "w1", q: "The coal we burn in power plants today mostly formed from…",
            o: ["Ancient swamp plants", "Dinosaur remains", "Ocean plankton", "Volcanic ash"], a: 0,
            why: "Giant swamp forests of the Carboniferous. Plankton gave us oil, not most of our coal." },
          { id: "w2", q: "The tallest trees in those swamps, about 30 m high, were giant relatives of…",
            o: ["Pine trees", "Club mosses", "Palm trees", "Bamboo"], a: 1,
            why: "Lycopsids. Today their cousins, club mosses, fit in your palm." },
        ],
      },
      // ---- after Slide 3 ----
      {
        id: "s", type: "match", scored: true, dur: 30, pts: 10, chips: true, chain: true,
        kicker: "Check · Slides 2 and 3", title: "Winners or losers?",
        rule: "When the forest broke apart, who gained and who lost? +10 each, −5 if wrong.",
        probs: ["Amphibians", "Amniotes (early reptile-like animals)", "Giant lycopsid trees", "Tree ferns"],
        doors: ["Gained", "Lost"],
        key: [1, 0, 1, 0],
        why: "Amphibians needed water for their eggs. Amniotes laid eggs on dry land.",
      },
      // ---- before Slide 4 ----
      {
        id: "f", type: "q", scored: true, pen: 0, dur: 12, pts: 10,
        kicker: "Predict · from our class notes", title: "Remember Lecture 1?",
        rule: "Two questions from class that explain the next slide. +10 if right. Wrong costs nothing.",
        qs: [
          { id: "f1", q: "Fewer trees → less water released into the air → less rain → even fewer trees. This is a…",
            o: ["Positive feedback", "Negative feedback", "No feedback at all"], a: 0,
            why: "Positive feedback adds to the first change. That is how the drying fed itself." },
          { id: "f2", q: "Most of today's big deserts sit near 30° latitude. Why?",
            o: ["Dry air of the Hadley cell sinks there", "They are far from every ocean", "They get the most sunlight", "Mountains block all the rain"], a: 0,
            why: "Air rises at the ITCZ and sinks dry near 30°. Shift the rain belt and a rainforest can dry out." },
        ],
      },
      // ---- after Slide 4 ----
      {
        id: "o", type: "order", scored: true, dur: 40, pts: 10, chain: true,
        kicker: "Check · Slide 4", title: "Put the collapse in order",
        rule: "Tap the four steps in the order they happened. +10 for each step in the right place, −5 if wrong.",
        items: [
          "The rainforest breaks into isolated patches",
          "Ice sheets on Gondwana grow and shrink with orbital cycles",
          "Less transpiration means less rain, so the drying feeds itself",
          "The tropics turn drier and more seasonal",
        ],
        key: [2, 0, 3, 1],
      },
      // ---- before Slide 5 ----
      {
        id: "a", type: "q", scored: true, pen: 0, dur: 12, pts: 10,
        kicker: "Predict · from Lecture 2", title: "Pick the archive",
        rule: "One guess. +10 if right. Wrong costs nothing.",
        qs: [
          { id: "a1", q: "To read the climate of 305 million years ago, which archive is useless?",
            o: ["Ice cores", "Fossil soils", "Fossil leaves", "Layers of rock"], a: 0,
            why: "The oldest ice core goes back about 800,000 years. Even the ocean floor is only about 170 million years old." },
        ],
      },
      // ---- after Slide 6 ----
      {
        id: "m", type: "match", scored: true, dur: 45, pts: 10, chain: true,
        kicker: "Check · Slides 5 and 6", title: "Match the proxy to its clue",
        rule: "Five proxies, five clues. +10 each, −5 if wrong, 0 for No idea.",
        probs: ["Leaf stomata (tiny pores)", "Oxygen isotopes in marine shells", "Cyclothems (repeating rock layers)", "Volcanic ash, uranium-lead dating", "Fossil spores"],
        doors: ["Sea level rising and falling", "Which plants lived there", "CO₂ in the air", "The age of the rock", "Ocean temperature and ice volume"],
        key: [2, 4, 0, 3, 1],
      },
      {
        id: "g", type: "q", scored: true, dur: 20, pts: 20, grid: true, board: true, chain: true,
        kicker: "Check · Slide 6", title: "Pick the graph",
        rule: "Which graph matches the record? +20 if right, −5 if wrong.",
        qs: [
          { id: "g1", q: "Which graph shows CO₂ in the Late Carboniferous record (Montañez 2016)?",
            o: [
              { t: "Flat all along", g: co2([fn(() => 0.42)]) },
              { t: "Steady climb", g: co2([fn((x) => 0.12 + 0.76 * x)]) },
              { t: "Big repeated swings", g: co2([fn(swing, 160)]) },
              { t: "One sudden spike", g: co2([fn((x) => 0.25 + 0.6 * Math.exp(-Math.pow((x - 0.7) / 0.04, 2)), 160)]) },
            ], a: 2,
            why: "CO₂ swung between about 150 and 700 ppm, roughly every 100,000 years." },
        ],
      },
      // ---- before Slide 7 ----
      {
        id: "z", type: "q", scored: true, pen: 0, dur: 12, pts: 10,
        kicker: "Predict · before the models", title: "How cold can it get?",
        rule: "One guess. +10 if right. Wrong costs nothing.",
        qs: [
          { id: "z1", q: "Keep lowering CO₂ in a climate model of that time. When does the whole Earth freeze over?",
            o: ["Below about 280 ppm", "Below about 200 ppm", "Below about 40 ppm", "Never, whatever the CO₂"], a: 2,
            why: "Feulner (2017): around 40 ppm, in a cold orbit. Proxies say about 100, so Earth came close." },
        ],
      },
      // ---- after Slide 8 ----
      {
        id: "v", type: "q", scored: true, dur: 20, pts: 20, grid: true, chain: true,
        kicker: "Check · Slide 8", title: "Does the model pass?",
        rule: "Dots are proxy data. The gold line is the model. +20 if right, −5 if wrong.",
        qs: [
          { id: "v1", q: "Which model passes the test against the proxies?",
            o: [
              { t: "Model A", g: mvp([fn((x) => Math.min(0.97, swing(x) + 0.42), 160)]) },
              { t: "Model B", g: mvp([fn(() => 0.5)]) },
              { t: "Model C", g: mvp([fn(swing, 160)]) },
              { t: "Model D", g: mvp([fn((x) => 0.5 + 0.36 * Math.sin(x * Math.PI * 2 * 4.2 + 2.5), 160)]) },
            ], a: 2,
            why: "Only C follows the dots. Agreement builds trust. A miss shows what the model is still missing." },
        ],
      },
      {
        id: "t", type: "q", scored: true, dur: 12, pts: 10, chain: true,
        kicker: "Check · Slides 7 and 8", title: "Myth or fact?",
        rule: "Quick fire. +10 if right, −5 if wrong, 0 for No idea.",
        qs: [
          { id: "t1", q: "Burying plant carbon as coal pulled CO₂ out of the air.", o: ["Fact", "Myth"], a: 0,
            why: "Carbon locked in coal left the atmosphere for millions of years." },
          { id: "t3", q: "A model that matches the past is guaranteed to predict the future.", o: ["Fact", "Myth"], a: 1,
            why: "It earns more trust, not a guarantee." },
        ],
      },
      // ---- before Slide 9 ----
      {
        id: "h", type: "q", scored: false, dur: 12,
        kicker: "Hot take · no points", title: "Your view",
        rule: "No right answer. Just tell us what you think.",
        qs: [
          { id: "h1", q: "Could a rainforest collapse like this happen in our lifetime?",
            o: ["Yes, it is already starting", "Maybe", "No, we are safe"] },
        ],
      },
      // ---- after Slide 9 ----
      {
        id: "k", type: "q", scored: true, dur: 15, pts: 20, board: true,
        kicker: "The final round", title: "Last chance",
        rule: "Two questions on Slide 9. +20 if right, −5 if wrong.",
        qs: [
          { id: "k1", q: "Lovejoy and Nobre (2018) estimate the Amazon's tipping point at about how much deforestation?",
            o: ["5 to 10%", "20 to 25%", "About 50%", "About 80%"], a: 1,
            why: "An estimate, not an exact line. Fire and warming push it closer." },
          { id: "k2", q: "After the collapse, the lycopsid forests…",
            o: ["Came back within 1,000 years", "Came back after the ice age", "Never came back", "Took over the whole planet"], a: 2,
            why: "The biome that came back was not the one that was lost." },
        ],
      },
    ],
  };
})();
