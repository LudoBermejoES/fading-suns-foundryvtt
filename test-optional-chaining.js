// Test file for optional chaining
const obj = {
  foo: {
    bar: {
      baz: 42
    }
  }
};

// Using optional chaining
const value1 = obj?.foo?.bar?.baz;
const value2 = obj?.nonExistent?.prop;

// Using nullish coalescing
const value3 = value2 ?? 'default value';

console.log(value1); // 42
console.log(value2); // undefined
console.log(value3); // 'default value' 