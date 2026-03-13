const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  /const response = await axios\.post\('https:\/\/leetcode\.com\/graphql', \{\s*query,\s*variables: \{ username \}\s*\}\);/,
  `const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com/',
        'Content-Type': 'application/json'
      }
    });`
);
fs.writeFileSync('server.js', code);
