# follow-stream

A readable stream that wraps the follow `change` event and proxies all the
events I care about through itself. This makes buffering `change` events SUPER
simple if we don't care about them yet.
