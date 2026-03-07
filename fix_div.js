const fs = require('fs');
const p = 'c:/Users/drsac/Downloads/skillantra-main/skillantra - modify - Copy/src/components/AuthForm.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/          \)}\r?\n        <\/div>\r?\n      <\/div>\r?\n    <\/div>\r?\n  \);\r?\n}/, `          )}
        </div>
        </div>
      </div>
    </div>
  );
}`);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed div tags');
