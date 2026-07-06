' Atrovia — copy site files + push to GitHub (double-click to run)
Option Explicit
Dim sh, fso, repo, src, log, psCmd
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
repo = "C:\Users\Administrator\Atrovia.co-site"
src = "C:\Users\Administrator\Downloads\Unzipped\atrovia site"
log = "C:\Users\Administrator\atrovia_deploy_full_output.txt"

' Copy HTML files
On Error Resume Next
fso.CopyFile src & "\index.html", repo & "\index.html", True
fso.CopyFile src & "\signup.html", repo & "\signup.html", True
fso.CopyFile src & "\about.html", repo & "\about.html", True
fso.CopyFile src & "\atrovia-site.html", repo & "\atrovia-site.html", True
fso.CopyFile src & "\preview.html", repo & "\preview.html", True
On Error GoTo 0

' Run full deploy (git init, commit, push)
psCmd = "powershell -NoProfile -ExecutionPolicy Bypass -File """ & repo & "\scripts\deploy-now.ps1"""
sh.CurrentDirectory = repo
sh.Run psCmd, 1, True

If fso.FileExists(log) Then
    Dim ts, txt
    Set ts = fso.OpenTextFile(log, 1)
    txt = ts.ReadAll
    ts.Close
    If InStr(txt, "git push exit code: 0") > 0 Then
        MsgBox "SUCCESS! Site pushed to GitHub." & vbCrLf & vbCrLf & "https://github.com/mrcarter67/Atrovia.co-site", vbInformation, "Atrovia Upload"
    Else
        MsgBox "Deploy finished — check log for details." & vbCrLf & vbCrLf & log, vbExclamation, "Atrovia Upload"
    End If
Else
    MsgBox "Deploy script did not create a log file. Run manually from PowerShell.", vbCritical, "Atrovia Upload"
End If