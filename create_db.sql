CREATE DATABASE IF NOT EXISTS election;
CREATE TABLE IF NOT EXISTS election.party (
	name VARCHAR(3) CHARSET utf8,
	votes BIGINT UNSIGNED NOT NULL,
	PRIMARY KEY (name),
	INDEX party_votes_ind (votes)
)