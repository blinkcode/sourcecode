/**
 *
 *
 * @param {Function} variable
 * @returns
 * @description 判断传入的回调是不是函数类型
 */
const validFunction = variable => {
  return typeof variable === "function";
};
/**
 *
 * 添加promise的三种状态
 */
const pending = "PENDING";
const fullfilled = "FULLFILLED";
const rejected = "REJECTED";

class MyPromise {
  constructor(handle) {
    if (!validFunction(handle)) {
      throw new Error("myPromise must accept a function as parameter");
    }
    // 添加状态
    this._status = pending;

    // 添加状态
    this._value = undefined;

    // 添加成功回调函数队列
    this._fullfilledQueues = [];

    // 添加失败回调函数队列
    this._rejectedQueues = [];

    // 执行handle
    try {
      // this._resolve()
      handle(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
  _resolve(val) {
    if (this._status !== pending) return;
    const run = () => {
      // 依次执行成功队列中的函数，并清空队列
      const runFullfilled = value => {
        let cb;
        while ((cb = this._fullfilledQueues.shift())) {
          cb(value);
        }
      };
      const runRejected = value => {
        let cb;
        while ((cb = this._rejectedQueues.shift())) {
          cb(error);
        }
      };
      /**
       *
       * 如果resolve参数为promise对象，则必须等待参数状态改变后，当前的promise对象才会改变
       * 且状态取决于参数promise的状态
       */
      if (val instanceof MyPromise) {
        val.then(
          value => {
            this._value = value;
            this._status = fullfilled;
            runFullfilled(value);
          },
          err => {
            this._value = err;
            this._status = rejected;
            runRejected(err);
          }
        );
      } else {
        this._value = val;
        this._status = fullfilled;
        runFullfilled(val);
      }
    };
    // 为了支持同步的promise ，这里采用异步调用
    setTimeout(run, 0);
  }

  _reject(error) {
    if (this._status !== pending) return;
    const run = () => {
      this._status = rejected;
      this._value = error;
      let cb;
      while ((cb = this._rejectedQueues.shift())) {
        cb(error);
      }
    };

    // 为了支持同步Promise，这里采用异步调用

    setTimeout(run, 0);
  }

  then(onFullfilled, onRejected) {
    const { _value, _status } = this;

    // 返回一个新的promise对象
    return new MyPromise((onFullfilledNext, onRejectedNext) => {
      // 封装一个成功时执行的方法
      let fullfilled = value => {
        try {
          if (!validFunction(onFullfilled)) {
            onFullfilledNext(value);
          } else {
            let res = onFullfilled(value);
            if (res instanceof MyPromise) {
              // 如果当前返回的是myPromise对象，则必须等待当前状态改变后再执行下一个回调
              res.then(onFullfilledNext, onRejectedNext);
            } else {
              // 否则将返回结果直接作为参数传入下一个
              onFullfilledNext(value);
            }
          }
        } catch (error) {
          onRejectedNext(error);
        }
      };

      // 封装一个执行失败的函数
      let rejected = error => {
        try {
          if (!validFunction(onFullfilled)) {
            onRejectedNext(error);
          } else {
            let res = onRejected(error);
            if (res instanceof MyPromise) {
              res.then(onFullfilledNext, onRejectedNext);
            } else {
              onRejectedNext(error);
            }
          }
        } catch (err) {
          onRejectedNext(err);
        }
      };
      switch (_status) {
        case pending:
          this._fullfilledQueues.push(onFullfilled);
          this._rejectedQueues.push(onRejected);
          break;
        case fullfilled:
          onFullfilled(_value);
          break;
        case rejected:
          onRejected(_value);
          break;

        default:
          break;
      }
    });
  }
}

let p = new MyPromise((resolve,reject) => {
    setTimeout(() => {
        resolve('3s')
    }, 3000);
})

p.then((res) => {
    console.log(res);
})