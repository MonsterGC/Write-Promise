(function Promise(window) {
    const PENDING = "pending"
    const RESOLVED = "resolved"
    const REJECTED = "rejected"

    function Promise(executer) {
        const _this = this
        _this.status = PENDING
        _this.data = undefined
        _this.callbacks = []

        function resolve(value) {
            if (_this.status != PENDING) return;
            _this.status = RESOLVED;
            _this.data = value;
            if (_this.callbacks.length > 0) {
                setTimeout(() => {
                    _this.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                })
            }
        }

        function reject(reason) {
            if (_this.status != PENDING) return;
            _this.status = REJECTED;
            _this.data = reason;
            if (_this.callbacks.length > 0) {
                setTimeout(() => {
                    _this.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                })
            }
        }

        try {
            executer(resolve, reject)
        } catch (err) {
            reject(err)
        }
    }

    Promise.prototype.then = function (onResolved, onRejected) {
        onResolved = typeof onResolved == "function" ? onResolved : value => value;
        onRejected = typeof onRejected == "function" ? onRejected : err => { throw err }
        const _this = this;
        return new Promise((resolve, reject) => {
            function handle(callback) {
                try {
                    const result = callback(_this.data);
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (err) {
                    reject(err)
                }
            }
            if (_this.status == PENDING) {
                _this.callbacks.push({
                    onResolved(value) {
                        handle(onResolved)
                    }, onRejected(reason) {
                        handle(onRejected)
                    }
                })
            } else if (_this.status == RESOLVED) {
                setTimeout(() => {
                    handle(onResolved)
                })
            } else {
                setTimeout(() => {
                    handle(onRejected)
                })
            }
        })
    }

    Promise.prototype.catch = function (onRejected) {
        this.then(undefined, onRejected)
    }

    Promise.resolve = function (value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(resolve, reject)
            } else {
                resolve(value)
            }
        })
    }

    Promise.reject = function (reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }

    Promise.all = function (promises) {
        const values = new Array(promises.length);
        let indexTemp = 0;

        return new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                p.then(
                    value => {
                        indexTemp++;
                        values[index] = value;

                        if (indexTemp == promises.length) {
                            resolve(values)
                        }
                    },
                    reason => { //由于前面状态的原因，一次退出全部退出
                        reject(reason);
                    }
                )
            })
        })
    }

    Promise.race = function (promises) {
        return new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                p.then(
                    value=>{
                        resolve(value);
                    },
                    reason=>{
                        reject(reason);
                    }
                )
            })
        })
    }
    window.Promise = Promise;
}
)(window)