import { Router } from "express";
import Card from "../models/Card.schema.js"
import { createNewCard, deleteCard, getCardById, getUserCards, toggleCardLike, updateCard } from "../services/cardsDataAccess.service.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isBusiness } from "../../middlewares/isBusiness.js";
import { isUser } from "../../middlewares/isUser.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import { isRegisteredUser } from "../../middlewares/isRegisteredUser.js";

const cardRouter = Router();

/* ----- GET all cards request ----- */
cardRouter.get("/", async (req, res) => {
    try {
        const cards = await Card.find();
        return res.json(cards);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

/* ----- POST create a new card request ----- */
/*needs authentication*/
cardRouter.post("/", auth, isBusiness, async (req, res) => {
    try {
        /* Combines the client's card data with the authenticated user's ID This ensures the new card is linked to the user who created it */
        const cardData = { ...req.body, userId: req.user._id }
        const card = await createNewCard(cardData);
        return res.json(card);
    } catch (err) {
        res.status(400).send(err.message);
    };
});

/* ----- GET my-cards request ----- */
/*needs authentication*/
cardRouter.get("/my-cards", auth, async (req, res) => {
    try {
        const myCards = await getUserCards(req.user._id);
        return res.json(myCards);
    } catch (err) {
        res.status(404).send("No Cards Found");
    }
});

/* ----- GET card by Id request ----- */
cardRouter.get("/:id", async (req, res) => {
    try {
        const card = await getCardById(req.params.id);
        return res.json(card);
    } catch (err) {
        res.status(404).send(err.message);
    };
});

/* ----- PUT card by Id request ----- */
/* needs authentication */
cardRouter.put("/:id", auth, isRegisteredUser(true), async (req, res) => {
    try {
        const card = await updateCard(req.params.id, req.body);
        return res.json(card);
    } catch (err) {
        res.status(400).send(err.emssage);
    }
});
/* ----- DELETE card by Id request ----- */
/* needs authentication */
cardRouter.delete("/:id", auth, isUser, async (req, res) => {
    try {
        const card = await deleteCard(req.params.id);
        return res.json({ message: "Card deleted successfully", card });
    } catch (err) {
        res.status(404).send(err.message);
    };
});

/* ----- PATCH request to like/unlike a card ----- */
/*needs authentication*/
cardRouter.patch("/:id", auth, async (req, res) => {
    try {
        const card = await toggleCardLike(req.params.id, req.user._id);
        return res.json(card);
    } catch (err) {
        res.status(400).send(err.message);
    };
});

/* ----- PATCH request to change the bizNumber----- */
/*needs authentication*/
cardRouter.patch("/bizNumber/:id", auth, isAdmin, async (req, res) => {
    try {
        /* $ne: req.params.id not equal to the card's _id we are updating */
        const existingCard = await Card.findOne(
            { bizNumber: req.body.bizNumber, _id: { $ne: req.params.id } });
        if (existingCard) {
            return res.status(409).json({ message: "bizNumber is already taken" });
        };
        const cardToUpdate = await Card.findById(req.params.id);
        cardToUpdate.bizNumber = req.body.bizNumber;
        await cardToUpdate.save();
        return res.json({ message: "bizNumber changed successfully", cardToUpdate });
    } catch (err) {
        res.status(500).send(err.message);
    };
});


export default cardRouter;