# Changelog
## [Version 1.1.0] (28.07.2017 - 10:51 AM)
#### Bugfixes
* Properly handle condition witin the "output" event so the client does not crash when
the CAI-server returns a number

## [Version 1.0.0] (19.07.2017 - 05:13 PM)
#### Bugfixes
* add 'return' statement in front of 'reject' calls within Promises. This fixes a bug where the promise was
rejected but some code got still executed even though it shouldn't

#### Features
* Add a message-buffer to the client. Whenever a message should be send to the CAI-server but the connection
is currently not up, the message will be buffered and send later on
* Replace throwing errors by just logging them to the console
* Add full documentation to all methods using JS-Doc synthax