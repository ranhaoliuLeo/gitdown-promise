const GitDown = require("../index").default
const assert = require("assert")

describe("测试模块",function(){                
    it("git clone", async () => {
        const git = new GitDown()
        try {
            let result = await git.download("direct:https://github.com/ranhaoliuLeo/test.git", "./download")
            console.log("result:",result)
            assert(result === 0)
            rmdirSync("./download")
            return 1
        } catch (err) {
            // assert.fail(err);
            throw new Error(err);
        }
    })
})
    