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

type repoDirect = {
    type: string;
    url: string;
    branchName: string;
}

type repoNormal = {
    type: string;
    origin: string;
    owner: string;
    name: string;
    branchName: string;
}

class GitDown {
    opts: any
    Clone: boolean
    SSH: boolean

    constructor(opts = {}, Clone = true, SSH = false) {
        this.opts = opts
        this.Clone = Clone
        this.SSH = SSH
    }
    
    async download(repoUrl: string, dest: string) {
        const repo = this.parse(repoUrl)
        const url = this.getRepoUrl(repo)
        if (this.Clone) {
            return await gitClone(repo, url, dest, this.opts)
        }
        return await urlDown(url, dest)
    }

    parse(repoUrl: string) {
        let match = DirectUrlReg.exec(repoUrl)
        if (match) {
            return getRepoDirect(match)
        }
        match = NormalUrlReg.exec(repoUrl)
        if (match) {
            return getRepoNormal(match)
        }
    }

    getUrl(repo): string {
        let result
        // Get origin with protocol and add trailing slash or colon (for ssh)
        var origin = addProtocol(repo.origin, this.SSH)
        if (/^git@/i.test(origin)) {
            origin = origin + ':'
        } else {
            origin = origin + '/'
        }

        // Build url
        if (this.Clone) {
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

    getRepoUrl(repo: repoDirect | repoNormal) {
        if (repo.type === Direct) {
            return (repo as repoDirect).url
        }
        return this.getUrl(repo)
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

async function gitClone(repo, url, dest, opts) {
    const cloneOptions = {
        checkout: repo.branchName,
        shallow: repo.branchName === 'master',
        ...opts
    }
    try {
        const result = await new Promise((resolve, reject) => {
            gitclone(url, dest, cloneOptions, function (err) {
                if (err === undefined) {
                    rm(dest + '/.git')
                    resolve(0)
                } else {
                    reject(err)
                }
            })
        })
        return result
    } catch (err) {
        throw new Error(err)
    }
}

async function urlDown(url, dest) {
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
    try {
        const result = await new Promise((resolve, reject) => {
            downloadUrl(url, dest, downloadOptions)
                .then(function (data) {
                    resolve(0)
                })
                .catch(function (err) {
                    reject(err)
                })
        })
        return result
    } catch (err) {
        throw new Error(err)
    }

}

export default GitDown