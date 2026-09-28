export const templates = {
  button: {
    label: 'A little button',
    hint: 'Try a different color, a softer corner, or a few words of your own.',
    html: '<div class="experiment">\n  <p>A SMALL START</p>\n  <button>Make something good ↗</button>\n</div>',
    css: '.experiment { text-align: center; }\np { font: 11px monospace; letter-spacing: .15em; margin-bottom: 24px; }\nbutton {\n  background: #d5f77a;\n  color: #191b18;\n  border: 1px solid #191b18;\n  border-radius: 40px;\n  padding: 18px 28px;\n  font: 600 16px system-ui;\n  box-shadow: 5px 5px 0 #191b18;\n}',
  },
  card: {
    label: 'Room for an idea',
    hint: 'Change the heading, give the card a new color, or play with spacing.',
    html: '<article class="card">\n  <span>01 / A WORK IN PROGRESS</span>\n  <h1>Good things<br>start small.</h1>\n  <p>A question. A few lines. Something new.</p>\n  <b>Keep going ↗</b>\n</article>',
    css: '.card {\n  width: min(300px, 100%);\n  padding: 28px;\n  background: #191b18;\n  color: #f0eee6;\n  border-radius: 4px;\n  transform: rotate(-3deg);\n}\nspan { font: 10px monospace; color: #d5f77a; }\nh1 { font: 36px/1.05 Georgia, serif; margin: 28px 0 16px; }\np { font: 14px/1.6 system-ui; color: #c3c6ba; }\nb { display: block; margin-top: 32px; color: #d5f77a; }',
  },
  postcard: {
    label: 'A place of your own',
    hint: 'Move the sun. Change the sky. Give this little landscape a name.',
    html: '<div class="postcard">\n  <div class="sky">\n    <div class="sun"></div>\n    <div class="mountain far"></div>\n    <div class="mountain near"></div>\n  </div>\n  <p>Somewhere I call home. ↗</p>\n</div>',
    css: '.postcard { width: min(320px, 100%); padding: 14px; background: #faf6e9; transform: rotate(3deg); box-shadow: 6px 8px 0 #191b1820; }\n.sky { height: 190px; background: #cfdfce; position: relative; overflow: hidden; }\n.sun { position: absolute; width: 48px; height: 48px; border-radius: 50%; background: #f9e49a; top: 25px; right: 30px; }\n.mountain { position: absolute; width: 200px; height: 200px; transform: rotate(45deg); }\n.far { background: #7f9983; left: 65px; top: 95px; }\n.near { background: #354d40; left: -35px; top: 120px; }\np { font: italic 16px Georgia, serif; margin: 18px 0 6px; }',
  },
};

export const aliases = new Map([
  ['logistics', 'afh-logistics'],
  ['comedy', 'el-sotano-comico'],
  ['estate', 'propiedades-allende'],
]);

export const help = `A few familiar commands. A little room to explore.

ls [path]        See what's in a folder
cd [path]        Move to a folder (or home)
pwd              See where you are
cat <file>       Read a note
open <project>   Find a project (try logistics)
learn [topic]    See what I'm learning
edit [example]  Try button, card, or postcard
theme <name>     Try cream or charcoal
play invaders   Visit the little arcade
clear           Start with a clean screen
help            You're here

Tip: use / for home and .. for the folder above.
This browser terminal supports these commands; it doesn't run Linux.`;
