# salesforce_certificate_grabber
A node.js module that checks certificate status for supplied Salesforce.com credentials. WIP.

# How to install
1. Clone repository:
```bash
git clone https://github.com/dariusstrasel/salesforce_certificate_grabber.git
```
2. Open shell in root directory of 'salesforce_certificate_grabber', if not done so.
3. Run 'npm install'
```bash
npm install
```
4. Add headless csv named 'secret.csv' with username and passwords for each Salesforce org. e.g. username,password
5. Execute getCredentials.js module as such:
```bash
node getCredentials.js
```

6. Success!

# Requirements:
- One csv file with username and password.
