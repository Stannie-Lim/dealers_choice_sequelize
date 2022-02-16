const express = require('express');

const Sequelize = require('sequelize');
const db = new Sequelize('postgres://localhost/movies_db');
const { UUID, UUIDV4, INTEGER, STRING, ENUM } = Sequelize.DataTypes;

const Movie = db.define('movie', {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4
  },
  title: {
    type: STRING,
  },
});

const Actor = db.define('actor', {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4
  },
  name: {
    type: STRING,
  },
});

const Genre = db.define('genre', {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4
  },
  name: {
    type: ENUM(['action', 'romance', 'comedy']),
  },
});

Genre.hasMany(Movie); // genreId gets added onto movie
Movie.hasMany(Actor); // movieId gets added onto actor

Actor.belongsTo(Movie); // movieId gets added onto actor 
Movie.belongsTo(Genre); // genreId gets added onto movie

const app = express();

const startAndSyncAndSeed = async () => {
  try {
    await db.sync({ force: true });

    const movies = ['SPIDERMAN NO WAY HOME', 'Ironman', 'The Notebook', 'Wedding Crashers'];

    const genres = ['action', 'romance', 'comedy'];
    // promise.all takes in an array of promises
    const createdGenres = await Promise.all(genres.map((genre) => Genre.create({ name: genre })));
    // createdGenres is an array of all of the genres in the database

    const [nwh, ironman, notebook, wc] = await Promise.all(movies.map((movie) => Movie.create({ title: movie, genreId: createdGenres[Math.floor(Math.random() * createdGenres.length)].id })));

    await Actor.create({ name: 'RDJ', movieId: ironman.id });
    await Actor.create({ name: 'Zendaya', movieId: nwh.id });
    await Actor.create({ name: 'Ryan Gosling', movieId: notebook.id });
    await Actor.create({ name: 'Will Farrell', movieId: wc.id });

    console.log('successfully seeeded'); // seed = put stuff in database
  } catch (err) {
    console.log(err);
  }

  app.listen(3000);
};

app.get('/', async (req, res, next) => {
  const actors = await Actor.findAll({
    include: Movie,
  });

  res.send(`
    <html>
      <body>
        ${actors.map(actor => `<a href='/${actor.id}'>${actor.name}</a><h1>${actor.movie.title}</h1>`)}
      </body>
    </html>
  `);
});

app.get('/:id', async (req, res, next) => {
  res.send(await Actor.findByPk(req.params.id, {
    include: Movie,
  }));
});

startAndSyncAndSeed();
