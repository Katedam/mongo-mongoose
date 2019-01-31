/* eslint-disable no-console*/

require('dotenv').config();
require('../lib/utils/connect')();

const mongoose = require('mongoose');
const app = require('../lib/app');
const request = require('supertest');
const Tweet = require('../lib/models/Tweet');
const User = require('../lib/models/User');
const { getRandomQuote } = require('../lib/services/ronSwansonApi');

jest.mock('../lib/services/ronSwansonApi');


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

  afterAll(done => {
    mongoose.connection.close();
    done();
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

  it('returns a random quote', () => {
    return getRandomQuote()
      .then(quote => {
        expect(quote).toEqual('I wanna punch you in the face so bad right now.');
      });
  });

  it('finds tweet by id', () => {
    return createTweet('kaiya')
      .then(createdTweet => {
        return request(app)
          .get(`/tweets/${createdTweet._id}`)
          .then(res => {
            expect(res.body).toEqual({
              handle: expect.any(Object),
              text: 'I heart Squirrels',
              _id: expect.any(String)
            });
          });
      });
  });

  it('throws an error if no id found', () => {
    return createTweet('kaiya')
      .then(() => {
        return request(app)
          .get('/tweets/5c4927d922befdf50cdba9bd')
          .then(res => {
            expect(res.statusCode).toBe(404);
          });
      });
  });

  it('finds by id and update', () => {
    return createTweet('kaiya')
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

  it('returns a list of tweets', done => {
    return Promise.all(['kaiya', 'kaiya'].map(el => createTweet(el)))
      .then(() => {
        return request(app)
          .get('/tweets');
      })
      .then(res => {
        console.log(res.body);
        expect(res.body).toHaveLength(2);
        done();
      });
  });

  it('deletes a tweet by id', () => {
    return createTweet('kaiya')
      .then(oopsTweet => {
        return request(app)
          .delete(`/tweets/${oopsTweet._id}`);
      })
      .then(res => {
        expect(res.body).toEqual({ deleted: 1 });
      });
  });

});
