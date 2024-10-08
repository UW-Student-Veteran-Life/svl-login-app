/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains a router to retrieve, delete, and create login options
 */
const { addOption, getOptions, deleteOption } = require('../db/options');
const { Option } = require('../core/Option');
const express = require('express');

const router = express.Router();
router.use(express.json());

router.get('/options', async (req, res) => {
  try {
    const options = await getOptions(req.database);

    res.status(200).json(options);
  } catch (e) {
    console.error('Unable to retrieve list of options');
    console.error(e);
    res.status(500).send(`There was an error getting the information you requested: ${e}`);
  }
});

router.post('/options', async (req, res) => {
  const description = req.body.description;

  if (description === undefined) {
    res.status(400).send('There must be a non-null description included in the request body');
    return;
  }

  const descriptionUpper = description.charAt(0).toUpperCase() + description.slice(1);
  const option = new Option(descriptionUpper);

  try {
    const result = await addOption(option, req.database);

    if (result.statusCode >= 200 && result.statusCode < 300) {
      console.log(`Created a new option: ${descriptionUpper}`);
      res.status(201).json(option);
    } else {
      console.error('Unable to create a new login option');
      console.error(result.substatus);
      throw new Error(result.substatus);
    }
  } catch (error) {
    res.status(500).send(`There was an error getting the information you requested: ${error.message}`);
  }
});

router.delete('/options/:optionId', async (req, res) => {
  const optionId = req.params.optionId;

  try {
    await deleteOption(optionId, req.database);
    res.status(204).send(`Option ${optionId} successfully deleted`);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Unable to delete item with id ${optionId} from Options container, please check the logs`);
  }

});

module.exports = router;