/* eslint-disable no-console*/

require('dotenv').config();
require('../lib/utils/connect')();

const mongoose = require('mongoose');
const app = require('../lib/app');
const request = require('supertest');
const Tweet = require('../lib/models/Tweet');
const User = require('../lib/models/User');


describe('tweets app', () => {
  const createTweet = (handle, text = 'I heart Squirrels') => {
    return createUser(handle)
      .then(user => {
        return Tweet.create({ handle: user._id, text })
          .then(tweet => ({ ...tweet, _id: tweet._id.toString() }));
      });
  };

  const createUser = (handle = 'ladybeard', name = 'kaiya', email = 'schnepherd@gmail.com') => {
    return User.create({ handle, name, email })
      .then(user => {
        return { ...user, _id: user._id.toString() };
      });
  };

  beforeEach(done => {
    return mongoose.connection.dropDatabase(() => {
      done();
    });
  });

  it('creates a new tweet', () => {
    return createUser()
      .then(createdUser => {
        return request(app)
          .post('/tweets')
          .send({
            handle: createdUser._id,
            text: 'I\'m writing a book on PHIL-osophy'
          })
          .then(res => {
            expect(res.body).toEqual({
              handle: expect.any(String),
              text: 'I\'m writing a book on PHIL-osophy',
              _id: expect.any(String),
              __v: 0
            });
          });
      });
  });

  it.only('finds tweet by id', () => {
    return createTweet('kaiya')
      .then(createdTweet => {
        return request(app)
          .get(`/tweets/${createdTweet._id}`)
          .then(res => {
            expect(res.body).toEqual({
              handle: expect.any(Object),
              text: 'I heart Squirrels',
              _id: expect.any(String),
              __v: 0
            });
          });
      });
  });

  it('finds by id and update', () => {
    return createTweet()
      .then(createdTweet => {
        return Promise.all([
          Promise.resolve(createdTweet._id),
          request(app)
            .patch(`/tweets/${createdTweet._id}`)
            .send({ text: 'HOOOJ' })
        ]);
      })
      .then(([_id]) => {
        return request(app)
          .get(`/tweets/${_id}`)
          .then((res => {
            expect(res.body.text).toEqual('HOOOJ');
          }));
      });
  });

  it('returns a list of tweets', () => {
    return Promise.all(['I heart Squirrels', 'Sardine Saturday is my fave!'].map(createTweet))
      .then(() => {
        return request(app)
          .get('/tweets');
      })
      .then(res => {
        expect(res.body).toHaveLength(2);
      });
  });

  it('deletes a tweet by id', () => {
    return createTweet()
      .then(oopsTweet => {
        return request(app)
          .delete(`/tweets/${oopsTweet._id}`);
      })
      .then(res => {
        expect(res.body).toEqual({ deleted: 1 });
      });
  });

});