import React, { useEffect, useRef, useState } from "react";
import font from "../../styles/Font.module.scss";
import styles from "./MainPQModal.module.scss";
import MarkdownEditor from "@uiw/react-markdown-editor";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import { toastClear, toastError, toastLoading } from "../../modules/Functions";
import {
  collection,
  doc,
  addDoc,
  Timestamp,
  updateDoc,
  getFirestore,
} from "firebase/firestore";

const MainPQModal = ({ setModalState, modalType }) => {
  const firestore = getFirestore();
  const location = useLocation();
  const [title, setTitle] = useState("");
  const [mdValue, setMDValue] = useState("");
  const [tags, setTags] = useState([]);
  const [tagsData, setTagsData] = useState(null);
  const modalRef = useRef(null);

  const uid = localStorage.getItem("uid");

  const titleChange = (e) => setTitle(e.target.value);
  const mdValueChange = (e) => setMDValue(e);
  const tagInput = (e) => {
    if (e.key === "Enter") {
      addTag(e.target.value);
      e.target.value = "";
    }
  };

  const addTag = (tagValue) => {
    if (tags.indexOf(tagValue) == -1) {
      // 중복 없을때
      const tempTags = [...tags];
      tempTags.push(tagValue);
      setTags(tempTags);
    } else {
      toastError("이미 추가된 태그입니다!")
    }
  }

  const closeModal = () => {
    setModalState(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setModalState(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  });

  useEffect(() => {
    const render = () => {
      return (
        tags.map((item, index) => (
          <p
            key={index}
            onClick={() => removeTag(index)}
            className={`${font.fs_12} ${font.fw_7}`}
          >
            {item}
          </p>
        ))
      )
    }
    setTagsData(render())
  }, [tags])

  const removeTag = (index) => {
    const tempTags = [...tags];
    tempTags.splice(index, 1);
    setTags(tempTags)
  }

  const submitPQ = async () => {
    if (modalType == "QnAs") {
      if (title) {
        if (mdValue) {
          if (tags.length > 0) {
            toastLoading("다른 개발자에게 질문하는중입니다!");
            await addDoc(collection(firestore, modalType), {
              userID: uid,
              createdAt: Timestamp.fromDate(new Date()),
              postTitle: title,
              postContent: mdValue,
              postTags: tags,
            }).then(async (result) => {
              await updateDoc(doc(firestore, modalType, result.id), {
                postID: result.id,
              }).then(() => {
                toastClear();
                closeModal();
              });
            });
          } else {
            toastError("태그를 입력해주세요!")
          }
        } else {
          toastError("내용을 입력해주세요!")
        }
      } else {
        toastError("제목을 입력해주세요!");
      }

    }

    if (modalType == "Posts") {
      if (mdValue) {
        toastLoading("게시물을 업로드 중입니다!");
        await addDoc(collection(firestore, modalType), {
          userID: uid,
          createdAt: Timestamp.fromDate(new Date()),
          postContent: mdValue,
          likeCount: 0,
        }).then(async (result) => {
          await updateDoc(doc(firestore, modalType, result.id), {
            postID: result.id,
          }).then(() => {
            toastClear();
            closeModal();
          });
        });
      } else {
        toastError("내용을 입력해주세요!")
      }
    }
  };

  return (
    <div className={styles.modalWrapper}>
      <button
        className={`${styles.closeBtn} ${font.fs_16} `}
        type="button"
        onClick={closeModal}
      >
        X
      </button>
      <ToastContainer position="top-right" autoClose={2000} />
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.buttonsWrapper}>
          <i />
          <div className={styles.titleBox}>
            <p className={`${font.fs_14} ${font.fw_7}`}>
              {
                modalType == "QnAs" ? 
                "새 질문 올리기" :
                "새 게시물 올리기"
              }
            </p>
          </div>
          <div className={styles.btnBox}>
            <button
              className={`${styles.submitBtn} ${font.fw_5}`}
              onClick={submitPQ}
            >
              {
                modalType == "QnAs" ? 
                "질문하기" :
                "공유하기"
              }
            </button>
          </div>
        </div>
        {modalType == "QnAs" ? (
          <div className={styles.writeTitle}>
            <input
              className={`${font.fs_14} ${font.fw_7}`}
              type="text"
              value={title}
              maxLength={50}
              placeholder="제목을 입력해주세요 (50자 이내)"
              onChange={titleChange}
            />
          </div>
        ) : null}
        <div className={styles.writeContent}>
          <MarkdownEditor
            value={mdValue}
            onChange={(e) => mdValueChange(e)}
            className={styles.memoBoxMemo}
            previewWidth={"100%"}
            style={{
              fontSize: 16,
            }}
            toolbars={[
              "bold", "italic", "strike",
              "underline", "quote", "link", "image",
              "code", "codeBlock"
            ]}
            toolbarsMode={["preview"]}
          />
        </div>
        {modalType == "QnAs" ? (
          <div className={styles.writeTag}>
            <input
              className={`${font.fs_12} ${font.fw_5}`}
              type="text"
              placeholder="태그를 입력해주세요 (Enter로 구분)"
              onKeyUp={(e) => tagInput(e)}
            />
            <div className={styles.tagsBox}>
              {tagsData}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default MainPQModal;
