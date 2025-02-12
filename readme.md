Last login: Wed Feb 12 16:47:33 on ttys001
cd                     'c.       Dell1@MacBook-Pro-3.local
                 ,xNMM.          -------------------------
               .OMMMMo           OS: macOS 15.3 24D60 arm64
               OMMM0,            Host: MacBookPro18,3
     .;loddo:' loolloddol;.      Kernel: 24.3.0
   cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: 5 days, 22 hours, 54 mins
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Packages: 151 (brew)
 XMMMMMMMMMMMMMMMMMMMMMMMX.      Shell: zsh 5.9
^RMMMMMMMMMMMMMMMMMMMMMMM:
cdMMMMMMMMMMMMMMMMMMMMMMM:         Resolution: 1920x1080, 1512x982
.MMMMMMMMMMMMMMMMMMMMMMMMX.      DE: Aqua
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.    WM: Rectangle
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   Terminal: iTerm2
^R.XMMMMMMMMMMMMMMMMMMMMMMMMK.
c   kMMMMMMMMMMMMMMMMMMMMMMd      Terminal Font: Monaco 12
     ;KMMMMMMMWXXWMMMMMMMk.      CPU: Apple M1 Pro
       .cooc,.    .,coo:.        GPU: Apple M1 Pro
                                 Memory: 2799MiB / 16384MiB





^R
(base) ➜  ~ conda deactivate
➜  ~ cd Documents/ntu_eee_code/lifelong-eee-master
➜  lifelong-eee-master git:(dev) ✗ curl "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5weHFjbHduaWN5YWV6a25tdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NjQ3MjUsImV4cCI6MjA0MTE0MDcyNX0.WCebNjljWTR0VzVXG1MKlI8kzVsUu_o9FEQcQOn9Ctk" http://localhost:8080/api/events\?type\=upcoming

curl: (3) URL rejected: Malformed input to a URL function
{"error":"No authorization token provided"}%
➜  lifelong-eee-master git:(dev) ✗ curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlpSb29SUkFJdDBUUWJEbFoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL25weHFjbHduaWN5YWV6a25tdmh3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMTM2MjMyOC1lOTEwLTRmYjctODIzMC1lZGFkZGFkM2JlMTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM5MzU4OTAxLCJpYXQiOjE3MzkzNTUzMDEsImVtYWlsIjoibWF5YW5ra3UwMDFAZS5udHUuZWR1LnNnIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Im1heWFua2t1MDAxQGUubnR1LmVkdS5zZyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJNYXlhbmsiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImYxMzYyMzI4LWU5MTAtNGZiNy04MjMwLWVkYWRkYWQzYmUxMiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM5MzU1MzAxfV0sInNlc3Npb25faWQiOiI1ZjE1NjRiZi03MzlmLTQxMWItOTNlYi05YzhhY2RiOTVmODgiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.yFZ8c7zdbQ5PPthfbx26i1QfPM1GU3pCUm5WY1DaCvQ" http://localhost:8080/api/events

[]%
➜  lifelong-eee-master git:(dev) ✗ curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IlpSb29SUkFJdDBUUWJEbFoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL25weHFjbHduaWN5YWV6a25tdmh3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMTM2MjMyOC1lOTEwLTRmYjctODIzMC1lZGFkZGFkM2JlMTIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM5MzU4OTAxLCJpYXQiOjE3MzkzNTUzMDEsImVtYWlsIjoibWF5YW5ra3UwMDFAZS5udHUuZWR1LnNnIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Im1heWFua2t1MDAxQGUubnR1LmVkdS5zZyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJNYXlhbmsiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImYxMzYyMzI4LWU5MTAtNGZiNy04MjMwLWVkYWRkYWQzYmUxMiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM5MzU1MzAxfV0sInNlc3Npb25faWQiOiI1ZjE1NjRiZi03MzlmLTQxMWItOTNlYi05YzhhY2RiOTVmODgiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.yFZ8c7zdbQ5PPthfbx26i1QfPM1GU3pCUm5WY1DaCvQ" http://localhost:8080/api/events

[]%
➜  lifelong-eee-master git:(dev) ✗ curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5weHFjbHduaWN5YWV6a25tdmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NjQ3MjUsImV4cCI6MjA0MTE0MDcyNX0.WCebNjljWTR0VzVXG1MKlI8kzVsUu_o9FEQcQOn9Ctk" http://localhost:8080/api/events

{"error":"Invalid token"}%
➜  lifelong-eee-master git:(dev) ✗ git add server/handlers/event.go
➜  lifelong-eee-master git:(dev) ✗ git add server/cmd/main.go
➜  lifelong-eee-master git:(dev) ✗ git add client/src/pages/common/EventsPage.jsx
➜  lifelong-eee-master git:(dev) ✗ git commit -m "fix get all events api"
[dev d65cf36] fix get all events api
 3 files changed, 44 insertions(+), 42 deletions(-)
➜  lifelong-eee-master git:(dev) ✗ git push origin dev
Enumerating objects: 23, done.
Counting objects: 100% (23/23), done.
Delta compression using up to 8 threads
Compressing objects: 100% (11/11), done.
Writing objects: 100% (12/12), 1.57 KiB | 1.57 MiB/s, done.
Total 12 (delta 8), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (8/8), completed with 8 local objects.
To https://github.com/cyprus09/eee-lifelong-master.git
   651a65c..d65cf36  dev -> dev
➜  lifelong-eee-master git:(dev) ✗ git add client/src/contexts/AuthContext.jsx
➜  lifelong-eee-master git:(dev) ✗ git add server/middleware/auth.go
➜  lifelong-eee-master git:(dev) ✗ git add client/src/components/common/Navbar.jsx
➜  lifelong-eee-master git:(dev) ✗ git commit -m "fix auth and logout to direct api call"
[dev 2258df6] fix auth and logout to direct api call
 3 files changed, 50 insertions(+), 42 deletions(-)
➜  lifelong-eee-master git:(dev) ✗ git push origin dev
Enumerating objects: 23, done.
Counting objects: 100% (23/23), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (12/12), 1.61 KiB | 1.61 MiB/s, done.
Total 12 (delta 8), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (8/8), completed with 8 local objects.
To https://github.com/cyprus09/eee-lifelong-master.git
   d65cf36..2258df6  dev -> dev
➜  lifelong-eee-master git:(dev) ✗ git checkout main
error: Your local changes to the following files would be overwritten by checkout:
	client/src/pages/common/EventsPage.jsx
	server/handlers/event.go
Please commit your changes or stash them before you switch branches.
error: The following untracked working tree files would be overwritten by checkout:
	README.md
Please move or remove them before you switch branches.
Aborting
➜  lifelong-eee-master git:(dev) ✗ git stash
Saved working directory and index state WIP on dev: 2258df6 fix auth and logout to direct api call
➜  lifelong-eee-master git:(dev) ✗ git checkout main
error: The following untracked working tree files would be overwritten by checkout:
	README.md
Please move or remove them before you switch branches.
Aborting
➜  lifelong-eee-master git:(dev) ✗ git checkout  main
Switched to branch 'main'
➜  lifelong-eee-master git:(main) ✗ git pull origin main
From https://github.com/cyprus09/eee-lifelong-master
 * branch            main       -> FETCH_HEAD
Already up to date.
➜  lifelong-eee-master git:(main) ✗ git checkout dev
Switched to branch 'dev'
➜  lifelong-eee-master git:(dev) ✗ git fetch