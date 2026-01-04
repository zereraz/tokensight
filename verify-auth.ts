// Test all auth methods to find what works

const websiteToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1NTc1NGViLTM2OWYtNGI1OC1iOTUzLWZjYWI3NGI3YmNjYiIsImVtYWlsIjoic2FoZWJqb3Q5NEBnbWFpbC5jb20ifQ.aVPJjehIqcR45suYBmbBQSj0NIHdBLkNUlqxXFNLK20LgxasiIVb1OaOoGKAD-iejqViG2Kid9TzQ1Ejx4ny9A";

const apiToken = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX3R5cGUiOiJQRVJTT05BTCIsInVzZXJfaWQiOjU0NDcyMjcsImFwaV9rZXkiOm51bGwsInVzZXJfa2V5IjoiZDliNzYwYzktZWE0Yi00MTEzLTlkZTEtOTAxNWE2ZDNiNTc4IiwiY3VzdG9tZXJfaWQiOiI0OTYxMTc2NjkzMTU5Njk5MyIsInVzZXJuYW1lIjpudWxsLCJjdXN0b21lciI6eyJpZCI6NTQ0NzIyNywiY3JlYXRlQnkiOm51bGwsImNyZWF0ZVRpbWUiOiIyMDI1LTEyLTI4IDIyOjE5OjU3IiwidXBkYXRlQnkiOm51bGwsInVwZGF0ZVRpbWUiOiIyMDI1LTEyLTI4IDIyOjE5OjU3IiwiY3JlYXRlQnlJZCI6bnVsbCwidXBkYXRlQnlJZCI6bnVsbCwiZW5hYmxlU3RhdHVzIjoiRU5BQkxFIiwiZGVsRmxhZyI6ZmFsc2UsImN1c3RvbWVyTnVtYmVyIjo0OTYxMTc2NjkzMTU5Njk5Mywibmlja05hbWUiOm51bGwsImN1c3RvbWVyTmFtZSI6bnVsbCwiZW1haWwiOm51bGwsInBob25lTnVtYmVyIjpudWxsLCJ1c2VyVHlwZSI6IlBFUlNPTkFMIiwic291cmNlIjoi6buY6K6kIiwiYXZhdGFyIjpudWxsLCJwYXNzd29yZCI6bnVsbCwiY2hhbm5lbCI6IlpfQUkiLCJvcGVuSWQiOm51bGwsInBob25lT3BlbklkIjpudWxsLCJhbWluZXJJZCI6bnVsbCwiYWNUeXBlIjoiTk9UX0FDIiwiYWNTdGF0ZSI6Ik5PVF9BQyIsImFjU3VibWl0VHlwZSI6Ik5PVF9TVUJNSVQiLCJzdGFydFRpbWUiOm51bGwsImVuZFRpbWUiOm51bGwsImNvdW50cnlDb2RlIjpudWxsLCJjY2ZNZW1iZXJJZCI6bnVsbCwic2VjdXJpdHlFbmNyeXB0RmxhZyI6Ik4iLCJjdXN0b21lcklkcyI6bnVsbCwib3JnYW5pemF0aW9uIjpudWxsLCJpbnZvaWNlVHlwZSI6bnVsbCwidW5pb25JZCI6bnVsbCwid2VjaGF0Tmlja05hbWUiOm51bGwsIm1haW5Vc2VTY2VuYXJpbyI6bnVsbCwiZW5hYmxlVHdvRmEiOm51bGwsImJldGFUZXN0ZXIiOmZhbHNlfX0.lLq9f_kSI8RglTYs9RL91hvi8ZSxTAwzX_bDm3vqHNvMz-SqzXiuthULeh_nNRF1LslTsaZE04-OsziHBIKE9A";

const endpoints = [
  "https://api.z.ai/api/biz/subscription/list",
  "https://z.ai/api/biz/subscription/list",
];

const authMethods = [
  { name: "Website Token (Bearer)", token: websiteToken, useCookie: false },
  { name: "API Token (Bearer)", token: apiToken, useCookie: false },
  { name: "Website Token (Cookie)", token: `z-ai-website-token=${websiteToken}`, useCookie: true },
  { name: "API Token (Cookie)", token: `z-ai-website-token=${apiToken}`, useCookie: true },
];

console.log("=".repeat(60));
console.log("Testing Z.ai API Authentication");
console.log("=".repeat(60));

for (const url of endpoints) {
  console.log(`\n📍 URL: ${url}\n`);

  for (const auth of authMethods) {
    try {
      const headers: Record<string, string> = {
        "accept": "application/json",
        "origin": "https://z.ai",
        "referer": "https://z.ai/manage-apikey/subscription",
      };

      if (auth.useCookie) {
        headers["cookie"] = auth.token;
      } else {
        headers["authorization"] = `Bearer ${auth.token}`;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.code === 200 && data.data) {
        console.log(`✅ ${auth.name}`);
        console.log(`   Works! Found ${data.data.length || 1} subscription(s)`);
        if (data.data[0]?.productName) {
          console.log(`   Plan: ${data.data[0].productName}`);
        }
      } else {
        console.log(`❌ ${auth.name}`);
        console.log(`   Error: ${data.msg} (code: ${data.code})`);
      }
    } catch (error: any) {
      console.log(`❌ ${auth.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

console.log("\n" + "=".repeat(60));
