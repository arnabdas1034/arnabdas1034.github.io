// Everything the game shows. Edit text here; do not change the "id" values once people have played.
window.KK = {
  title: "SAC 101",
  sub: "Karakoram Freshers Orientation",
  joinUrl: "arnabdas1034.github.io/sac",
  host: "Arnab",
  // JEE style: a wrong answer costs this many points. "No idea" and no answer cost nothing.
  penalty: 5,
  // Peaks of the Karakoram range
  teams: ["K2", "Gasherbrum", "Broad Peak", "Masherbrum", "Rakaposhi", "Saltoro", "Batura", "Saser"],

  acts: [
    {
      id: "poll", type: "q", scored: false, dur: 8,
      kicker: "Before we begin", title: "What do you think?",
      rule: "Three quick questions. No points, no wrong answers.",
      qs: [
        { id: "p1", q: "Do you have medical insurance through IIT Delhi right now?", o: ["Yes", "No", "No idea"] },
        { id: "p2", q: "Is housekeeping supposed to clean inside your room?", o: ["Yes", "No", "No idea"] },
        { id: "p3", q: "Can you check online which counsellor is free this very minute?", o: ["Yes", "No", "No idea"] },
      ],
    },
    {
      id: "match", type: "match", scored: true, dur: 40, pts: 10, chain: true,
      kicker: "Game one", title: "Match each problem to its door",
      rule: "Six problems, six doors. +10 for a correct match, −5 for a wrong one, 0 for No idea.",
      probs: [
        "Mess food was cold. Again.",
        "A friend has high fever at 1 AM",
        "A senior asks you to do something odd",
        "You have felt low for weeks",
        "You want a cheap second-hand cycle",
        "The WiFi in your room is dead",
      ],
      doors: [
        "BHM Marketplace",
        "Anti-ragging helpline",
        "WiFi complaint form",
        "Ambulance 6666 or Hospital 1500",
        "BHM complaints portal",
        "A counsellor, or Talk to a Dost",
      ],
      key: [4, 3, 1, 5, 0, 2],
    },
    {
      id: "ins", type: "q", scored: true, dur: 8,
      kicker: "Bonus question", title: "Guess the number",
      rule: "One question. +20 if right, −5 if wrong, 0 for No idea.",
      qs: [
        { id: "i1", q: "How much medical insurance do you have right now?",
          o: ["₹1 lakh", "₹1.5 lakh", "₹2 lakh", "₹6 lakh"], a: 2, pts: 20,
          why: "₹2 lakh per student, every year." },
      ],
    },
    {
      id: "scen", type: "talk", scored: true, dur: 60,
      kicker: "Game two", title: "What would you do?",
      rule: "Talk to your team. One team answers out loud. Points for every correct step.",
      cards: [
        { t: "Eleven at night, football. Your friend's ankle swells up like a balloon.",
          notes: "Call 6666 or 1000. IIT Hospital, or AIIMS. Two people go along with ID. Carry the e-card. Inform TPA in 24 hours. Get Part B stamped." },
        { t: "Your roommate has skipped meals and classes for a whole week.",
          notes: "Talk to them. Help a Friend. A counsellor. Warden or SAC Secretary." },
        { t: "Your bathroom tap has leaked for five days. Everyone says, 'kal ho jayega'.",
          notes: "Complaint on the BHM portal. Then the House Secretary." },
      ],
    },
    {
      id: "mf", type: "q", scored: true, dur: 8, pts: 10,
      kicker: "Game three", title: "Myth, or fact?",
      rule: "One statement at a time. +10 if right, −5 if wrong, 0 for No idea.",
      qs: [
        { id: "m1", q: "Insurance pays for an ordinary OPD visit.", o: ["Fact", "Myth"], a: 1, why: "Only for admissions of 24 hours or more, or day care." },
        { id: "m2", q: "Housekeeping is meant to clean your room.", o: ["Fact", "Myth"], a: 0, why: "It is in their contract." },
        { id: "m3", q: "You may claim insurance three months after discharge.", o: ["Fact", "Myth"], a: 1, why: "Thirty days. Miss it, lose it." },
        { id: "m4", q: "MATLAB is free for you.", o: ["Fact", "Myth"], a: 0, why: "Licensed through IITD." },
        { id: "m5", q: "Some counsellors sit inside hostels.", o: ["Fact", "Myth"], a: 0, why: "Check the live board on the BSW portal." },
        { id: "m6", q: "You pay into a Distress Fund every semester.", o: ["Fact", "Myth"], a: 0, why: "₹300, for students in crisis." },
        { id: "m7", q: "SAC decides your grades.", o: ["Fact", "Myth"], a: 1, why: "Grades are academics. SAC is everything else." },
      ],
    },
    {
      id: "voice", type: "wall", scored: false,
      kicker: "Chapter VI", title: "Your Voice",
      rule: "One problem, or one idea. One message each.",
    },
    {
      id: "kbc", type: "q", scored: true, dur: 8,
      kicker: "The final round", title: "Kaun Banega Karakorampati",
      rule: "Ten questions. The points climb. A wrong answer costs 5, No idea costs nothing.",
      qs: [
        { id: "k1", pts: 10, q: "Which number calls the campus ambulance?", o: ["1000", "1500", "6666", "6915"], a: 2 },
        { id: "k2", pts: 10, q: "Which board runs the mess and hostel maintenance?", o: ["BHM", "BRCA", "BSA", "BSW"], a: 0 },
        { id: "k3", pts: 20, q: "Your insurance e-card lives in which app?", o: ["DigiLocker", "eMate", "The BHM app", "Moodle"], a: 1 },
        { id: "k4", pts: 20, q: "Who is the Chairman of SAC?", o: ["The General Secretary", "The Dean of Student Affairs", "The Director", "The Warden"], a: 2 },
        { id: "k5", pts: 30, q: "How much do you pay into the Student Distress Fund each semester?", o: ["₹100", "₹300", "₹500", "₹1,000"], a: 1 },
        { id: "k6", pts: 30, q: "Who sits at the TPA help desk in IIT Hospital?", o: ["Mr. Ramesh", "Mr. Suresh", "Mr. Mahesh", "Mr. Ganesh"], a: 3 },
        { id: "k7", pts: 40, q: "A reimbursement claim must be submitted within how many days of discharge?", o: ["7 days", "15 days", "30 days", "90 days"], a: 2 },
        { id: "k8", pts: 40, q: "Minimum CGPA to contest any elected post?", o: ["6", "6.5", "7", "8"], a: 2 },
        { id: "k9", pts: 50, q: "Minimum hospital stay for an insurance claim, day care aside?", o: ["6 hours", "12 hours", "24 hours", "48 hours"], a: 2 },
        { id: "k10", pts: 50, q: "The night e-cart runs during which hours?", o: ["6 PM to 12 AM", "8 PM to 4 AM", "10 PM to 2 AM", "All 24 hours"], a: 1 },
      ],
    },
  ],
};
