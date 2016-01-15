## Kudu

A Node.js framework for rapidly building web services. This is an unstable
pre-release version intended for internal use. The API will stabilise over time
and documentation added before the final 1.0.0 release.

## FAQs

 - Why is this project called Kudu?

Because we are called Mammal our projects are often given the names of mammals.
The Kudu is a type of antelope often found in eastern Africa. It was randomly
selected from a large list of mammals.

## Notes

 - This project currently relies upon [`kudu-model-inherits-decorator`][kmid]
   which decorates a prototype with an `inherits` method. Since Babel 6 has
   disabled its "official" decorator transform pending spec updates we have to
   use [`babel-plugin-transform-decorators-legacy`][bptdl] to provide
   transpilation of the decorator syntax in use. When the decorator proposal is
   updated this project will be updated accordingly.

[kmid]: https://github.com/mammaldev/kudu-model-inherits-decorator
[bptdl]: https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy
