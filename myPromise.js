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
      // console.log('handle',handle)
      // 这个地方bind有些不明白了，这是咋执行的
      /** 
       * new MyPromise((resolve,reject) =>{
       *  resolve('123'); 
       * })
       * new 一个啥的时候用这种写法就可以写出漂亮的回调了
      */
      handle(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
  _resolve(val) {
    // promise的状态只能从pending ==> fullfilled或者pending ==> rejected
    if (this._status !== pending) return;

      const run = () => {
      // 依次执行成功队列中的函数，并清空队列
      const runFullfilled = value => {
        let cb;
        while ((cb = this._fullfilledQueues.shift())) {
          // 这里的cb应该是bind后的this.resolve();
          cb(value);
        }
      };
      const runRejected = error => {
        let cb;
        // console.log(this._rejectedQueues.length)
        while ((cb = this._rejectedQueues.shift())) {
          cb(value);
        }
      };
      /**
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
            console.log('83:',err)
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
    // const { _value, _status } = this;
    // // 返回一个新的promise对象
    // return new MyPromise((onFullfilledNext, onRejectedNext) => {
    //   // 封装一个成功时执行的方法
    //   let fullfilled = value => {
    //     try {
    //       if (!validFunction(onFullfilled)) {
    //         // 这个地方不仅要判断是不是一个函数还要判断是不是一个promise
    //         onFullfilledNext(value);
    //       } else {
    //         let res = onFullfilled(value);
    //         if (res instanceof MyPromise) {
    //           // 如果当前返回的是myPromise对象，则必须等待当前状态改变后再执行下一个回调
    //           res.then(onFullfilledNext, onRejectedNext);
    //         } else {
    //           // 否则将返回结果直接作为参数传入下一个
    //           onFullfilledNext(value);
    //         }
    //       }
    //     } catch (error) {
    //       onRejectedNext(error);
    //     }
    //   };

    //   // 封装一个执行失败的函数
    //   let rejected = error => {
    //     try {
    //       if (!validFunction(onFullfilled)) {
    //         onRejectedNext(error);
    //       } else {
    //         let res = onRejected(error);
    //         if (res instanceof MyPromise) {
    //           res.then(onFullfilledNext, onRejectedNext);
    //         } else {
    //           onRejectedNext(error);
    //         }
    //       }
    //     } catch (err) {
    //       onRejectedNext(err);
    //     }
    //   };
    //   console.log('status',_status)
    //   switch (_status) {
    //     case pending:
    //       console.log(111,onRejected)
    //       this._fullfilledQueues.push(fullfilled);
    //       this._rejectedQueues.push(rejected);
    //       break;
    //     case fullfilled:
    //       fullfilled(_value);
    //       break;
    //     case rejected:
    //       rejected(_value);
    //       break;

    //     default:
    //       break;
    //   }
    // });
    const { _value, _status } = this
      // 返回一个新的Promise对象
      return new MyPromise((onFulfilledNext, onRejectedNext) => {
        // 封装一个成功时执行的函数
        let fulfilled1 = value => {
          try {
            if (!isFunction(onFulfilled)) {
              onFulfilledNext(value)
            } else {
              let res =  onFulfilled(value);
              if (res instanceof MyPromise) {
                // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
                res.then(onFulfilledNext, onRejectedNext)
              } else {
                //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
                onFulfilledNext(res)
              }
            }
          } catch (err) {
            // 如果函数执行出错，新的Promise对象的状态为失败
            onRejectedNext(err)
          }
        }
        // 封装一个失败时执行的函数
        let rejected = error => {
          try {
            if (!isFunction(onRejected)) {
              onRejectedNext(error)
            } else {
                let res = onRejected(error);
                if (res instanceof MyPromise) {
                  // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
                  res.then(onFulfilledNext, onRejectedNext)
                } else {
                  //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
                  onFulfilledNext(res)
                }
            }
          } catch (err) {
            // 如果函数执行出错，新的Promise对象的状态为失败
            onRejectedNext(err)
          }
        }
        switch (_status) {
          // 当状态为pending时，将then方法回调函数加入执行队列等待执行
          case pending:
            this._fulfilledQueues.push(fulfilled1)
            this._rejectedQueues.push(rejected)
            break
          // 当状态已经改变时，立即执行对应的回调函数
          case fullfilled:
            fulfilled1(_value)
            break
          case rejected:
            rejected(_value)
            break
        }
      })
  }
  /**
   *
   * 添加catch方法，相当于调用then方法，只不过只传入rejected
   */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  // 添加静态resolve方法
  static resolve(value) {
    // 如果参数是myPromise实例，直接返回这个实例
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => {
      resolve(value);
    });
  }

  // 添加静态reject方法
  static reject(value) {
    return new MyPromise(reject => {
      reject(value);
    });
  }

  // 静态all方法
  static all(list) {
    return new MyPromise((resolve, reject) => {
      /**
       *
       * 返回值集合
       */
      let values = [];
      let count = 0;
      for (let [i, p] of list.entries()) {
        this.resolve(p).then(
          res => {
            values[i] = res;
            count++;
            if (count === list.length) {
              resolve(value);
            }
          },
          err => {
            reject(error);
          }
        );
      }
    });
  }

  // 静态race方法
  static race(list) {
    return new MyPromise((resolve, reject) => {
      for (let i of list) {
        // 只要有一个实例改变，新的Promise的状态就跟着改变
        this.resolve(i).then(
          res => {
            resolve(res);
          },
          err => {
            reject(err);
          }
        );
      }
    });
  }

  // 静态方法 finally
  finally(cb) {
    return this.then(
      value => MyPromise.then(cb()).then(() => value),
      value => MyPromise.then(cb()).then(() => { throw reason })
    );
  }
}


let p2 = new MyPromise((res,rej) => {
  setTimeout(() => {
   rej('收到lala')    
  }, 1000);
})
let p = new MyPromise((resolve, reject) => {
    resolve(p2);
});
p.then(res => {
  console.log('263:',res);
}).catch((error) => {
  console.log('265:',error)
})

class Main {
  constructor(handle){
    handle(this.run.bind(this),this.run1.bind(this))
  }
  run(){
    console.log('运行run')
  }
  run1(){
    console.log('运行run1');
  }
}
// let main = new Main((resolve,reject) => {
//   setTimeout(() => {
//     reject();
//   }, 2000);
// })