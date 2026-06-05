const fs = require('fs');
const path = require('path');
const FormData = require('form-data'); // now it will resolve because we are in backend dir

async function testUploads() {
    console.log('Testing uploads...');
    const baseUrl = 'http://localhost:5000/api';
    
    const ts = Date.now();
    const user = { username: `testuser_${ts}`, email: `test_${ts}@example.com`, password: 'password' };
    await fetch(`${baseUrl}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: user.password })
    });
    
    const setCookieHeader = loginRes.headers.get('set-cookie');
    // Extract just the connect.sid cookie part
    const cookieString = setCookieHeader ? setCookieHeader.split(';')[0] : '';
    console.log('Cookie:', cookieString);

    const repoRes = await fetch(`${baseUrl}/repos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookieString },
        body: JSON.stringify({ name: `testrepo_${ts}`, description: 'Test', isPrivate: false })
    });
    const repo = await repoRes.json();
    console.log('Repo:', repo);
    const serverPath = repo.repo?.server_path;

    const form1 = new FormData();
    form1.append('file', Buffer.from('Hello world file'), 'hello.txt');
    form1.append('path', '');
    
    const upRes1 = await fetch(`${baseUrl}/git/${serverPath}/upload`, {
        method: 'POST',
        headers: {
            'Cookie': cookieString,
            ...form1.getHeaders()
        },
        body: form1
    });
    console.log('Single File Upload Status:', upRes1.status);
    console.log(await upRes1.json());

    const form2 = new FormData();
    form2.append('files', Buffer.from('Folder file 1'), 'file1.txt');
    form2.append('files', Buffer.from('Folder file 2'), 'file2.txt');
    form2.append('paths', JSON.stringify(['myFolder/file1.txt', 'myFolder/sub/file2.txt']));
    form2.append('currentPath', '');

    const upRes2 = await fetch(`${baseUrl}/git/${serverPath}/upload-folder`, {
        method: 'POST',
        headers: {
            'Cookie': cookieString,
            ...form2.getHeaders()
        },
        body: form2
    });
    console.log('Folder Upload Status:', upRes2.status);
    console.log(await upRes2.json());
}

testUploads().catch(console.error);
