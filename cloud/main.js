/** Testing:
curl -X POST \
-H "X-Parse-Application-Id: XXX" \
-H "X-Parse-Master-Key: XXX" \
https://localhost:8080/parse/functions/hello
 */
Parse.Cloud.define("hello", (req) => {
  return "Hello from parse";
});