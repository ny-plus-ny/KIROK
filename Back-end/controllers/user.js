const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const CryptoJS = require("crypto-js");

const { db } = require("../fireStore");
const { collection, getDocs } = require("firebase/firestore");

// kirokDB functions
const {
  getAllUsers,
  getKids,
  addKid,
  getKidRegistered,
  registrationRequest,
  checkRegistrationRequest,
} = require("./kirokDB");

// Team Secret Key
const { SECRET_KEY, PRIVATE_KEY, TEAM_CODE } = process.env;

module.exports = {
  // 모든 user ID (Admin)
  getAllUsersId: async (req, res) => {
    const key1 = req.query.admin === SECRET_KEY;
    const key2 =
      CryptoJS.AES.decrypt(req.query.admin, PRIVATE_KEY).toString(
        CryptoJS.enc.Utf8
      ) === TEAM_CODE;

    if (key1 && key2) {
      try {
        const result = await getAllUsers();

        res.status(200).send(result);
      } catch (err) {
        res.status(400).send(err);
      }
    } else {
      res.status(400).send("Team SecretKey를 확인해주세요.");
    }
  },

  // 사용자 자녀등록 요청
  setUserKids: async (req, res) => {
    const { requestKidInfo, kakaoId } = req.body;
    const checkKid = await getKids(kakaoId, requestKidInfo.name);

    // 아이가 등록이 되어있는지
    if (checkKid) {
      res.status(201).send("이미 아이가 등록되어 있습니다.");

      // 등록이 되어있지 않으면
    } else {
      const checkRegistered = await checkRegistrationRequest(requestKidInfo);

      // 기관 대기열에 등록 되어있는지 확인
      if (checkRegistered) {
        res.status(201).send("기관 등록 후 수락 대기중입니다.");

        // 아직 등록 대기 전이면
      } else {
        const added = await registrationRequest(requestKidInfo);

        if (added) {
          res.status(200).send("기관 요청대기 등록이 되었습니다.");
        } else {
          res.status(400).send("DB 추가 중 실패");
        }
      }
    }
  },
};
