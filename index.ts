import downloadUrl from 'download'
import gitclone from 'git-clone'
import { sync as rm } from 'rimraf'

// validate repo url, if the url is not valid and throw an error
const DirectUrlReg = /^(?:(direct):([^#]+)(?:#(.+))?)$/
const NormalUrlReg = /^(?:(github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/

const Direct = "direct"
const Github = "github"
const Gitlab = "gitlab"
const Bitbucket = "bitbucket"

// origin that request from 
// type origin = 'github' | 'gitlab' | 'bitbucket'

interface GitDown {
    opts: any
    isClone: boolean
    isSSH: boolean
}

class GitDown {
    constructor(opts = {}, isClone = true, isSSH = false) {
        this.opts = opts
        this.isClone = isClone
        this,isSSH = isSSH
    }
    async download(repo, dest): Promise<void> {
        return new Promise((resolve, reject) => {
            repo = init(repo)
            let url
            if (repo.type === Direct) {
                url = repo.url
            } else {
                url = this.getUrl(repo)
            }
            if (this.isClone) {
                const cloneOptions = {
                    checkout: repo.branchName,
                    shallow: repo.branchName === 'master',
                    ...this.opts
                }
                gitclone(url, dest, cloneOptions, function (err) {
                    if (err === undefined) {
                        rm(dest + '/.git')
                        resolve()
                    } else {
                        reject(err)
                    }
                })
                return 
            }
            const downloadOptions = {
                extract: true,
                strip: 1,
                mode: '666',
                ...this.opts,
                headers: {
                    accept: 'application/zip',
                    ...(this.opts.headers || {})
                }
            }
            downloadUrl(url, dest, downloadOptions)
                .then(function (data) {
                    resolve()
                })
                .catch(function (err) {
                    reject(err)
                })
        })
    }

    getUrl(repo) {
        let result
        // Get origin with protocol and add trailing slash or colon (for ssh)
        var origin = addProtocol(repo.origin, this.isSSH)
        if (/^git@/i.test(origin)) {
            origin = origin + ':'
        } else {
            origin = origin + '/'
        }
    
        // Build url
        if (this.isClone) {
            result = origin + repo.owner + '/' + repo.name + '.git'
        } else {
            if (repo.type === 'github') {
                result = origin + repo.owner + '/' + repo.name + '/archive/' + repo.checkout + '.zip'
            } else if (repo.type === 'gitlab') {
                result = origin + repo.owner + '/' + repo.name + '/repository/archive.zip?ref=' + repo.checkout
            } else if (repo.type === 'bitbucket') {
                result = origin + repo.owner + '/' + repo.name + '/get/' + repo.checkout + '.zip'
            }
        }
    
        return result
    }
}

function init(repoUrl: string) {
    let match = DirectUrlReg.exec(repoUrl)
    if (match) {
        return getRepoDirect(match)
    }
    match = NormalUrlReg.exec(repoUrl)
    if (match) {
        return getRepoNormal(match)
    }
}

function getRepoDirect(match: RegExpExecArray) {
    const url = match[2]
    const branchName = match[3] || 'master'
    return {
        type: Direct,
        url: url,
        branchName: branchName,
    }
}

function getRepoNormal(match: RegExpExecArray) {
    const type = match[1] || Github
    let origin = match[2] || null
    const owner = match[3]
    const name = match[4]
    const branchName = match[5] || 'master'
    if (origin == null) {
        if (type === Github) {
            origin = 'github.com'
        }
        if (type === Gitlab) {
            origin = 'gitlab.com'
        }
        if (type === Bitbucket) {
            origin = 'bitbucket.org'
        }
    }
    return {
        type: type,
        origin: origin,
        owner: owner,
        name: name,
        branchName: branchName
    }
}

function addProtocol(origin: string, isSSH: boolean) {
    if (!/^(f|ht)tps?:\/\//i.test(origin)) {
        if (isSSH) {
            origin = 'git@' + origin
        } else {
            origin = 'https://' + origin
        }
    }
    return origin
}

