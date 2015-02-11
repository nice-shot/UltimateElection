SELECT ranked.name, ranked.votes, ranked.rank
  FROM (SELECT name, votes, @rank:=@rank + 1 AS rank
          FROM election.party, (SELECT @rank:=0) AS init
         ORDER BY votes DESC) AS ranked,
       (SELECT rank
          FROM (SELECT name, votes, @rank_a:=@rank_a + 1 AS rank
                  FROM election.party, (SELECT @rank_a:=0) AS init
                 ORDER BY votes DESC) AS ranked
         WHERE name = ?) AS user_rank
 WHERE ranked.rank > user_rank.rank - 4
 	   AND ranked.rank < user_rank.rank + 4