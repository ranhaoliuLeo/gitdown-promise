const NormalUrlReg = /^(?:(direct):([^#]+)(?:#(.+))?)$/


repoUrl = "direct:https://github.com/ranhaoliuLeo/gitdown-promise.git"
match = NormalUrlReg.exec(repoUrl)

console.log(match)

