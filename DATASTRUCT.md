## data structure

| key 				 							| what
----------------------------|--------------------------------------
| `faved!<timestamp>`				| { status metadata }
| `follow!<identifier>`			| { user metadata } // who you follow
| `follower!<identifier>`		| { user metadata } // who follows you
| `identifier`		 					| "unique id"
| `profile`			 						| { user metadata }
| `status!<timestamp>`			| { status metadata }

## user metadata

	{
		id: <identifier>,
		name: <name>,
		bio: <bio>
	}

## status metadata

	{
		id: <id>,
		created: <timestamp>,
		account: { user metadata },
		replyTo: <id>,
		faved: true | false
	}
